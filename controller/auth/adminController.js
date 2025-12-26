const { getPool, sql } = require("../../config/db.config");
const { hashPassword } = require("../../utils/helpers");

async function getTokensByDate(req, res) {
  const dateStr = req.query.date || new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "100", 10);
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Date", sql.Date, dateStr)
      .input("Page", sql.Int, page)
      .input("PageSize", sql.Int, pageSize)
      .execute("sp_GetTokensByDate");

    res.json({ tokens: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

async function createUser(req, res) {
  const { username, password, role, displayName } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ message: "missing fields" });

  try {
    const pool = await getPool();
    const hash = await hashPassword(password);
    await pool
      .request()
      .input("Username", sql.NVarChar(100), username)
      .input("PasswordHash", sql.NVarChar(500), hash)
      .input("Role", sql.NVarChar(50), role)
      .input("DisplayName", sql.NVarChar(200), displayName || null)
      .execute("sp_CreateUser");

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

async function getPushSubs(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().execute("sp_GetAllPushSubscriptions");
    res.json({ subs: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

async function getUsers(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().execute("sp_GetUsers");
    res.json({ users: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = { getTokensByDate, createUser, getPushSubs, getUsers };
