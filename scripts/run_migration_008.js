require('dotenv').config();
const { getPool, closePool } = require('../config/db.config');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const pool = await getPool();
        const sqlContent = fs.readFileSync(path.join(__dirname, '../migration/008_update_sps.sql'), 'utf8');
        
        const batches = sqlContent.split('GO');
        for (const batch of batches) {
            if(batch.trim()) {
                await pool.request().query(batch);
                console.log("Executed batch from 008");
            }
        }
        console.log("Migration 008 complete");
    } catch (err) {
        console.error("Migration failed", err);
    } finally {
        await closePool();
    }
}

runMigration();
