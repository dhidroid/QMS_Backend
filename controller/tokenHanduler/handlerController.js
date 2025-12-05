const { getPool, sql } = require("../../config/db.config");
const pushService = require("../../services/pushService.js");
// const { getIO } = require("../sockets/realtime"); 

async function updateStatus(req, res) {
  const { tokenGuid, status, remarks } = req.body;
  const performedBy = req.user
    ? req.user.displayName || req.user.username
    : "handler";

  if (!tokenGuid || !status)
    return res.status(400).json({ message: "missing fields" });

  try {
    const pool = await getPool();
    await pool
      .request()
      .input("TokenGuid", sql.UniqueIdentifier, tokenGuid)
      .input("NewStatus", sql.NVarChar(50), status)
      .input("PerformedBy", sql.NVarChar(100), performedBy)
      .input("Remarks", sql.NVarChar(500), remarks || null)
      .execute("sp_UpdateTokenStatus");

    // get token details to send to clients
    const tokenResult = await pool
      .request()
      .input("TokenGuid", sql.UniqueIdentifier, tokenGuid)
      .execute("sp_GetTokenByGuid");
    const token = tokenResult.recordset[0];

    // broadcast to central display
    // broadcast to central display
    // if (typeof io !== 'undefined')
    //   io.emit("token:status", {
    //     tokenGuid,
    //     status,
    //     tokenNumber: token?.TokenNumber,
    //   });

    // web push notify all subscribers
    await pushService.notifyAllClients({
      title: `Token ${token.TokenNumber} ${status}`,
      body: `Status changed to ${status}`,
      data: { tokenGuid, tokenNumber: token.TokenNumber, status },
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

async function callNext(req, res) {
  const performedBy = req.user
    ? req.user.displayName || req.user.username
    : "handler";
  
  const { counterName } = req.body; // Expect counterName from frontend

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("PerformedBy", sql.NVarChar(100), performedBy)
      .input("CounterName", sql.NVarChar(50), counterName || "Counter 1") // Default fallback
      .output("OutTokenGuid", sql.UniqueIdentifier)
      .execute("sp_CallNextToken");

    const tokenGuid = result.output.OutTokenGuid;

    if (tokenGuid) {
      res.json({ success: true, tokenGuid, message: "Next token called" });
    } else {
      res.json({ success: false, message: "No pending tokens" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = { updateStatus, callNext };
