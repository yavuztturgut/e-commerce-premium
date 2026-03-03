const sql = require('mssql');

const configs = [
    { name: '127-NoEnc', config: { server: '127.0.0.1', port: 49941, options: { encrypt: false, trustServerCertificate: true } } },
    { name: '127-Enc', config: { server: '127.0.0.1', port: 49941, options: { encrypt: true, trustServerCertificate: true } } },
    { name: 'Local-NoEnc', config: { server: 'localhost', port: 49941, options: { encrypt: false, trustServerCertificate: true } } },
    { name: 'Local-Enc', config: { server: 'localhost', port: 49941, options: { encrypt: true, trustServerCertificate: true } } }
];

async function run() {
    for (const test of configs) {
        console.log(`\n--- Testing: ${test.name} ---`);
        const dbConfig = {
            ...test.config,
            user: 'sa',
            password: 'Yavuz1903*',
            database: 'CerenAdenDB',
            connectionTimeout: 5000
        };
        try {
            const pool = await new sql.ConnectionPool(dbConfig).connect();
            console.log(`✅ SUCCESS: ${test.name}`);
            await pool.close();
            break;
        } catch (err) {
            console.log(`❌ FAILED: ${test.name} - ${err.message}`);
            if (err.originalError) console.log(`   Detail: ${err.originalError.message}`);
        }
    }
}

run();
