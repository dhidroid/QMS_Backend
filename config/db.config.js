const sql = require("mssql");

/**
 * @typedef {import("mssql").ConnectionPool} ConnectionPool
 */

/**
 * MSSQL Config
 * Uses ENV if available, falls back to provided defaults.
 */
const config = {
    user: process.env.DB_USER || "dhinesh_QMS_WEB_DB",
    password: process.env.DB_PASSWORD || "QMS_WEB_DB",
    server: process.env.DB_SERVER || "sql.bsite.net",
    database: process.env.DB_DATABASE || "dhinesh_QMS_WEB_DB",
    port: parseInt(process.env.DB_PORT || "1433", 10),

    options: {
    instanceName: "MSSQL2016",
    encrypt: true,
    trustServerCertificate: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const fs = require('fs');
const path = require('path');

/**
 * Checks if the database is initialized (tables exist).
 * If not, runs the migration script.
 */
const initializeDB = async (pool) => {
    try {
        // Check if 'Users' table exists
        const checkResult = await pool.request().query(`
      SELECT * 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND  TABLE_NAME = 'Users'
    `);

        if (checkResult.recordset.length === 0) {
            console.log('⚠️  Database seems empty. Running migration...');

            const migrationFilePath = path.join(__dirname, '../migration/QMS_WEB_DB.sql');

            if (fs.existsSync(migrationFilePath)) {
                let sqlContent = fs.readFileSync(migrationFilePath, 'utf8');

                // Remove "USE [DB_NAME]" commands to avoid switching databases if name differs
                sqlContent = sqlContent.replace(/^USE\s+.*$/gim, '-- USE command removed by auto-migration');

                // Split by "GO" (case insensitive, usually on new lines)
                const commands = sqlContent.split(/^\s*GO\s*$/gim);

                for (const cmd of commands) {
                    const trimmedCmd = cmd.trim();
                    if (trimmedCmd) {
                        await pool.request().batch(trimmedCmd); // or query()
                    }
                }
                console.log('✅ Migration executed successfully.');
            } else {
                console.warn('⚠️  Migration file not found at:', migrationFilePath);
            }
        } else {
            console.log('✅ Database tables already exist.');
        }
    } catch (err) {
        console.error('❌ Migration logic failed:', err);
        // Continue - don't crash the app just because migration check failed, 
        // though it might fail later if tables are missing.
    }
};

let pool = null;

/**
 * @function getPool
 * @description Returns the global SQL connection pool (singleton).
 *              Reconnects automatically if broken.
 * @returns {Promise<ConnectionPool>}
 */
const getPool = async () => {
  try {
    // Reuse existing pool if alive
    if (pool && pool.connected) return pool;

    // Reconnect if pool exists but died
    if (pool && !pool.connected) {
      await pool.close().catch(() => {});
      pool = null;
    }

    // Create new pool
    pool = await new sql.ConnectionPool(config).connect();

    console.log(
      `\n✅ Connected to MSSQL Database: ${config.database} (server: ${config.server})\n`
    );

      // Initial Database Check & Migration
      await initializeDB(pool);

    // Listener: reset pool on errors
    pool.on("error", (err) => {
      console.error("❌ SQL Pool Error:", err);
      pool = null; // triggers reconnection on next request
    });

    return pool;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

/**
 * Graceful shutdown helper
 */
const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("🧹 MSSQL connection closed");
  }
};

module.exports = { sql, getPool, closePool };
