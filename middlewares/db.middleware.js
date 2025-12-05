const { getPool } = require("../config/db.config.js");

const dbMiddleware = async (req, res, next) => {
  try {
    // Reuse existing pool (mssql recommended pattern)
    const pool = await getPool();

    if (!pool.connected) {
      await pool.connect();
    }

    req.db = pool;

    console.log("[DB] Connection ready for request:", req.method, req.url);

    next();
  } catch (error) {
    console.error(
      "[DB ERROR] Failed to establish DB connection:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Internal database connection error",
      error: error.message,
    });
  }
};

module.exports = dbMiddleware;
