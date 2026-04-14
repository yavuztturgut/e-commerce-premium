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
        console.log('✅ Users table checked/created.');

        // Add 2FA columns if they don't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'TwoFactorCode')
            BEGIN
                ALTER TABLE Users ADD TwoFactorCode NVARCHAR(6) NULL;
            END
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'TwoFactorExpiry')
            BEGIN
                ALTER TABLE Users ADD TwoFactorExpiry DATETIME NULL;
            END
        `);
        console.log('✅ 2FA columns checked/added to Users table.');

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

        // Create Orders Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
            BEGIN
                CREATE TABLE Orders (
                    OrderID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT FOREIGN KEY REFERENCES Users(UserID),
                    OrderDate DATETIME DEFAULT GETDATE(),
                    TotalAmount DECIMAL(18, 2) NOT NULL,
                    Status NVARCHAR(20) DEFAULT 'Hazırlanıyor',
                    Address NVARCHAR(255),
                    City NVARCHAR(100),
                    Zip NVARCHAR(20)
                )
            END
        `);
        console.log('✅ Orders table checked/created.');

        // Create OrderItems Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
            BEGIN
                CREATE TABLE OrderItems (
                    OrderItemID INT PRIMARY KEY IDENTITY(1,1),
                    OrderID INT FOREIGN KEY REFERENCES Orders(OrderID),
                    ProductID INT FOREIGN KEY REFERENCES Products(ProductID),
                    Quantity INT NOT NULL,
                    Price DECIMAL(18, 2) NOT NULL
                )
            END
        `);
        console.log('✅ OrderItems table checked/created.');

        // Verify tables
        const tables = await pool.request().query("SELECT name FROM sys.tables WHERE name IN ('Users', 'Favorites', 'Orders', 'OrderItems')");
        console.log('Current tables in DB:', tables.recordset.map(t => t.name));

        console.log('✨ Database Setup Completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Setup Failed:', err);
        process.exit(1);
    }
}

createTables();
