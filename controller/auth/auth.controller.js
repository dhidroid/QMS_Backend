const { getPool, sql } = require("../../config/db.config.js");
const jwt = require("jsonwebtoken");
const { comparePassword } = require("../../utils/helpers.js");

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Missing creds" });

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Username", sql.NVarChar(100), username)
      .query(
        "SELECT TOP 1 * FROM Users WHERE Username = @Username AND IsActive = 1"
      );

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await comparePassword(password, user.PasswordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.UserId,
        username: user.Username,
        role: user.Role,
        displayName: user.DisplayName,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { login };
