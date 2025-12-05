const { getPool, sql } = require("../../config/db.config.js");
const { generateQRCodeBase64 } = require("../../utils/qr.js");

async function createToken(req, res) {
  const { fullName, mobile, purpose, extra } = req.body;
  if (!fullName) return res.status(400).json({ message: "name required" });

  try {
    const pool = await getPool();
    const request = pool
      .request()
      .input("FullName", sql.NVarChar(200), fullName)
      .input("Mobile", sql.NVarChar(50), mobile || "")
      .input("Purpose", sql.NVarChar(200), purpose || "")
      .input(
        "Extra",
        sql.NVarChar(sql.MAX),
        extra ? JSON.stringify(extra) : null
      )
      .output("OutTokenGuid", sql.UniqueIdentifier)
      .output("OutTokenNumber", sql.Int)
      .output("OutQRCode", sql.NVarChar(sql.MAX));

    const result = await request.execute("sp_CreateToken");

    const guid = result.output.OutTokenGuid;
    const tokenNumber = result.output.OutTokenNumber;
    const qrPayload = result.output.OutQRCode;

    // Fallback if payloads are null (implies SP issue), but this logic is safer
    if (!guid) {
        throw new Error("Failed to generate Token GUID from Stored Procedure");
    }

    const dataUrl = await generateQRCodeBase64(qrPayload);

    await pool
      .request()
      .input("Guid", sql.UniqueIdentifier, guid)
      .input("QRCodeBase64", sql.NVarChar(sql.MAX), dataUrl)
      .query(
        "UPDATE Tokens SET QRCodeBase64 = @QRCodeBase64 WHERE TokenGuid = @Guid"
      );

    const tokenObj = {
      tokenGuid: guid,
      tokenNumber,
      qrDataUrl: dataUrl,
    };

    res.json({ success: true, token: tokenObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

async function getTokenByGuid(req, res) {
  const { guid } = req.params;
  if (!guid || guid === 'null' || guid === 'undefined') {
    return res.status(400).json({ message: "Invalid GUID" });
  }
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("TokenGuid", sql.UniqueIdentifier, guid)
      .execute("sp_GetTokenByGuid");
    const rec = result.recordset[0];
    res.json({ token: rec || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

async function getDisplayStatus(req, res) {
  try {
    const pool = await getPool();
    
    // Get Now Serving (Status = 'called') - Sort by UpdateTime desc to get latest
    const servingRes = await pool.request().query(`
       SELECT TOP 1 TokenGuid, TokenNumber, CounterName, UpdatedAt 
       FROM Tokens 
       WHERE Status = 'called' AND TokenDate = CAST(GETDATE() AS DATE)
       ORDER BY UpdatedAt DESC
    `);
    
    // Get Queue (Status = 'pending')
    const queueRes = await pool.request().query(`
       SELECT TOP 5 TokenGuid, TokenNumber, CreatedAt
       FROM Tokens 
       WHERE Status = 'pending' AND TokenDate = CAST(GETDATE() AS DATE)
       ORDER BY TokenNumber ASC
    `);

    res.json({
        success: true,
        nowServing: servingRes.recordset[0] || null,
        queue: queueRes.recordset || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = { createToken, getTokenByGuid, getDisplayStatus };