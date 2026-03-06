const { sql, poolPromise } = require('./db');

async function createTables() {
    try {
        const pool = await poolPromise;
        console.log('⏳ Creating Tables...');

        // Create Users Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
            BEGIN
                CREATE TABLE Users (
                    UserID INT PRIMARY KEY IDENTITY(1,1),
                    FullName NVARCHAR(100),
                    Email NVARCHAR(100) UNIQUE NOT NULL,
                    PasswordHash NVARCHAR(255) NOT NULL,
                    Role NVARCHAR(20) DEFAULT 'user',
                    CreatedAt DATETIME DEFAULT GETDATE()
                )
            END
        `);
        console.log('✅ Users table checked/created.');

        // Create Favorites Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Favorites')
            BEGIN
                CREATE TABLE Favorites (
                    FavoriteID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT FOREIGN KEY REFERENCES Users(UserID),
                    ProductID INT FOREIGN KEY REFERENCES Products(ProductID),
                    CreatedAt DATETIME DEFAULT GETDATE()
                )
            END
        `);
        console.log('✅ Favorites table checked/created.');

        // Verify tables
        const tables = await pool.request().query("SELECT name FROM sys.tables WHERE name IN ('Users', 'Favorites')");
        console.log('Current tables in DB:', tables.recordset.map(t => t.name));

        console.log('✨ Database Setup Completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Setup Failed:', err);
        process.exit(1);
    }
}

createTables();
