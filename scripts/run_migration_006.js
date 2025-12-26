const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../config/db.config');

const MIGRATION_FILE = path.join(__dirname, '../migration/006_get_users.sql');

async function runMigration() {
    console.log("Starting migration 006...");
    try {
        const pool = await getPool();
        const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf8');

        // Split by 'GO'
        const batches = sqlContent
            .split(/\nGO\s*\n/i)
            .map(b => b.trim())
            .filter(b => b.length > 0);

        for (const batch of batches) {
             console.log("Executing batch...");
             if(batch) await pool.request().batch(batch);
        }

        console.log("Migration 006 completed successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await closePool();
        process.exit(0);
    }
}

runMigration();
