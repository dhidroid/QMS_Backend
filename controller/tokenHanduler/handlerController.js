const { getPool, sql } = require("../../config/db.config");
const pushService = require("../../services/pushService.js");
// const { getIO } = require("../sockets/realtime"); 

async function updateStatus(req, res) {
  const { tokenGuid, status, remarks, counterName } = req.body;
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
      .input("CounterName", sql.NVarChar(50), counterName || null)
      .execute("sp_UpdateTokenStatus");

    // get token details to send to clients
    const tokenResult = await pool
      .request()
      .input("TokenGuid", sql.UniqueIdentifier, tokenGuid)
      .execute("sp_GetTokenByGuid");
    const token = tokenResult.recordset[0];
    if (!token) return res.json({ success: true, message: 'Status updated, but token not found for notification' });

    // web push notify all subscribers
    await pushService.notifyAllClients({
      title: `Token ${token.TokenNumber} ${status}`,
      body: `Status changed to ${status}`,
      data: { tokenGuid, tokenNumber: token.TokenNumber, status },
    });

    // Feedback Trigger: If status is 'served' or 'completed'
    if (['served', 'completed'].includes(status.toLowerCase())) {
      try {
        // We can send a specific "Feedback Request" notification here
        // Using a distinct action or just a generic message for now
        await pushService.notifyAllClients({
          title: `How was your experience?`,
          body: `Token #${token.TokenNumber} served. Click to rate.`,
          data: {
            type: 'feedback_request',
            tokenGuid,
            tokenNumber: token.TokenNumber
          }
        });
      } catch (e) { console.error("Feedback push failed", e); }
    }

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
      .input("CounterName", sql.NVarChar(50), counterName || "Counter 1")
      .output("OutTokenGuid", sql.UniqueIdentifier)
      .execute("sp_CallNextToken");

    const tokenGuid = result.output.OutTokenGuid;

    if (tokenGuid) {
      // retrieve token details to broadcast and return to caller
      const tokenRes = await pool
        .request()
        .input('TokenGuid', sql.UniqueIdentifier, tokenGuid)
        .execute('sp_GetTokenByGuid');

      const token = tokenRes.recordset[0];

      // Broadcast to connected clients (display) if socket initialized
      try {
        const { getIO } = require('../../sockets/realtime');
        const io = getIO();
        io.emit('token:called', {
          tokenGuid,
          tokenNumber: token?.TokenNumber,
          counterName: token?.CounterName || counterName || 'Counter 1',
        });
      } catch (e) {
        // socket not initialized or no displays connected -- ignore
      }

      // web push notify subscribers as well
      try {
        await pushService.notifyAllClients({
          title: `Now Serving ${token.TokenNumber}`,
          body: `Please proceed to ${token.CounterName || counterName || 'Counter'}`,
          data: { tokenGuid, tokenNumber: token.TokenNumber }
        });
      } catch (e) {
        console.error('Push notify failed', e);
      }

      res.json({
        success: true,
        tokenGuid,
        tokenNumber: token?.TokenNumber,
        counterName: token?.CounterName || counterName || 'Counter 1',
        fullName: token?.FullName,
        purpose: token?.Purpose,
        mobile: token?.Mobile,
        message: 'Next token called'
      });
    } else {
      res.json({ success: false, message: 'No pending tokens' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = { updateStatus, callNext };
