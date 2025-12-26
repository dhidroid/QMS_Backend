require('dotenv').config();
const { getPool, closePool } = require('../config/db.config');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const pool = await getPool();
        const sqlContent = fs.readFileSync(path.join(__dirname, '../migration/009_delete_form.sql'), 'utf8');
        
        const batches = sqlContent.split('GO');
        for (const batch of batches) {
            if(batch.trim()) {
                await pool.request().query(batch);
                console.log("Executed batch from 009");
            }
        }
        console.log("Migration 009 complete");
    } catch (err) {
        console.error("Migration failed", err);
    } finally {
        await closePool();
    }
}

runMigration();
