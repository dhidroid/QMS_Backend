require('dotenv').config();
const { getPool, closePool } = require('../config/db.config');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const pool = await getPool();
        const sqlContent = fs.readFileSync(path.join(__dirname, '../migration/007_form_default.sql'), 'utf8');
        
        // Split by GO if needed, or simple execute
        const batches = sqlContent.split('GO');
        for (const batch of batches) {
            if(batch.trim()) {
                await pool.request().query(batch);
                console.log("Executed batch");
            }
        }
        console.log("Migration 007 complete");
    } catch (err) {
        console.error("Migration failed", err);
    } finally {
        await closePool();
    }
}

runMigration();
