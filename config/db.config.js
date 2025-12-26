const sql = require("mssql");

/**
 * @typedef {import("mssql").ConnectionPool} ConnectionPool
 */

/**
 * MSSQL Config
 * Uses ENV if available, falls back to provided defaults.
 */
// Prefer environment variables when available. Support both separate
// `DB_SERVER` + `DB_INSTANCE` or a single `DB_SERVER` containing a
// backslash (e.g. "host\\INSTANCE").
const env = process.env;

// Helper to strip surrounding quotes and whitespace
const strip = (s) => {
  if (!s) return s;
  let v = s.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
};

let server = strip(env.DB_SERVER) || 'sql.bsite.net';
let instanceName = strip(env.DB_INSTANCE) || 'MSSQL2016';
const user = strip(env.DB_USER) || 'dhinesh_QMS_WEB_DB';
const password = strip(env.DB_PASSWORD) || 'QMS_WEB_DB';
const database = strip(env.DB_DATABASE) || 'dhinesh_QMS_WEB_DB';
const port = parseInt(strip(env.DB_PORT) || '1433', 10);

// If DB_SERVER contains a backslash like host\INSTANCE, split it.
if (server && (server.includes('\\') || server.includes('\\\\'))) {
  // Normalize to single-backslash split
  const parts = server.split(/\\+/, 2);
  if (parts.length >= 2) {
    server = parts[0];
    instanceName = parts[1] || instanceName;
  }
}

const config = {
  user,
  password,
  server,
  database,
  port,
  connectionTimeout: 60000,
  requestTimeout: 60000,

  options: {
    instanceName,
    // prefer explicit env var, default true for modern SQL setups
    encrypt: (typeof env.DB_ENCRYPT !== 'undefined') ? (strip(env.DB_ENCRYPT) === 'true' || strip(env.DB_ENCRYPT) === '1') : true,
    trustServerCertificate: (typeof env.DB_TRUST_SERVER_CERTIFICATE !== 'undefined') ? (strip(env.DB_TRUST_SERVER_CERTIFICATE) === 'true' || strip(env.DB_TRUST_SERVER_CERTIFICATE) === '1') : true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 60000,
  },
};

// If a port is provided explicitly, `mssql` will use it — in that case an instanceName is not needed.
if (port && port !== 1433) {
  // leave instanceName, but it's safe to log that we'll use host:port
}

// Helpful debug output so deployment logs show the resolved DB host
console.log('→ MSSQL config:', {
  server: config.server,
  instanceName: config.options.instanceName,
  port: config.port,
  database: config.database,
  user: config.user ? '<redacted>' : undefined,
  encrypt: config.options.encrypt,
});

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
