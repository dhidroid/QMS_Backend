const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../config/db.config');

const MIGRATION_FILE = path.join(__dirname, '../migration/004_add_counter.sql');

async function runMigration() {
    console.log("Starting migration...");
    try {
        const pool = await getPool();
        const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf8');

        // Split by 'GO' keyword (case insensitive, on its own line)
        const batches = sqlContent
            .split(/\nGO\s*\n/i)
            .map(b => b.trim())
            .filter(b => b.length > 0);

        for (const batch of batches) {
             // Skip USE command if it causes issues or just run it (mssql usually ignores USE in cloud sometimes, but okay locally)
             // We'll run it.
             console.log("Executing batch...");
             await pool.request().batch(batch);
        }

        console.log("Migration completed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await closePool();
        process.exit(0);
    }
}

runMigration();
