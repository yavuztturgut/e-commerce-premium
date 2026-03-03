const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE,
    // Instance name varsa portu boş bırakıyoruz ki SQL Browser bulsun
    port: process.env.DB_INSTANCE ? undefined : (parseInt(process.env.DB_PORT) || 1433),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: process.env.DB_INSTANCE || undefined
    },
    connectionTimeout: 30000
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ Connected to MSSQL - CerenAdenDB');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed: ', err);
        process.exit(1);
    });

module.exports = {
    sql, poolPromise
};
