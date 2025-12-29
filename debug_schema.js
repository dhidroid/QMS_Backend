const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function checkSchema() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Tokens'
        `);
        console.log("Tokens Table Columns:", result.recordset.map(r => r.COLUMN_NAME));
    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await sql.close();
    }
}

checkSchema();
