const { getPool, sql } = require("../../config/db.config");

async function subscribe(req, res) {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint)
    return res.status(400).json({ message: "invalid sub" });
  
  try {
    const pool = await getPool();
    await pool
      .request()
      .input("Endpoint", sql.NVarChar(1000), subscription.endpoint)
      .input(
        "Keys",
        sql.NVarChar(sql.MAX),
        JSON.stringify(subscription.keys || {})
      )
      .execute("sp_AddPushSubscription");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "err" });
  }
}

module.exports = { subscribe };
