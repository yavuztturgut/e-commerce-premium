const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { sql, poolPromise } = require('./db');
const authMiddleware = require('./authMiddleware');
const { send2FACode } = require('./emailService');

const app = express();
app.use(cors());
app.use(express.json());

// --- AUTH ROUTES ---

// 1. Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const pool = await poolPromise;

        // Check if user exists
        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ message: 'Bu email zaten kayıtlı.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        await pool.request()
            .input('fullName', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .query('INSERT INTO Users (FullName, Email, PasswordHash) VALUES (@fullName, @email, @passwordHash)');

        res.status(201).json({ message: 'Kayıt başarılı!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Login (Step 1: Check Credentials & Send Code)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];
        if (!user) {
            return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
        }

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Geçersiz email veya şifre.' });
        }

        // Generate 6-digit code
        const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
        const twoFactorExpiry = new Date(Date.now() + 5 * 60000); // 5 minutes

        // Save code to DB
        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('code', sql.NVarChar, twoFactorCode)
            .input('expiry', sql.DateTime, twoFactorExpiry)
            .query('UPDATE Users SET TwoFactorCode = @code, TwoFactorExpiry = @expiry WHERE Email = @email');

        // Send email
        await send2FACode(email, twoFactorCode);

        res.json({
            twoFactorRequired: true,
            email: email,
            message: 'Doğrulama kodu e-posta adresinize gönderildi.'
        });
    } catch (err) {
        console.error(`[AUTH LOG] Login failed for ${req.body.email}:`, err.message);
        res.status(500).json({
            message: 'Giriş işlemi sırasında hata oluştu: ' + err.message,
            error: err.message
        });
    }
});

// 2a. Verify 2FA & Issue Token
app.post('/api/auth/verify-2fa', async (req, res) => {
    try {
        const { email, code } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];
        if (!user || user.TwoFactorCode !== code) {
            return res.status(400).json({ message: 'Geçersiz doğrulama kodu.' });
        }

        if (new Date() > new Date(user.TwoFactorExpiry)) {
            return res.status(400).json({ message: 'Doğrulama kodunun süresi dolmuş.' });
        }

        // Clear code after successful verification
        await pool.request()
            .input('email', sql.NVarChar, email)
            .query('UPDATE Users SET TwoFactorCode = NULL, TwoFactorExpiry = NULL WHERE Email = @email');

        const token = jwt.sign(
            { userId: user.UserID, role: user.Role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (err) {
        console.error(`[AUTH LOG] 2FA verification failed for ${req.body.email}:`, err.message);
        res.status(500).json({
            message: 'Doğrulama sırasında hata oluştu: ' + err.message,
            error: err.message
        });
    }
});

// 2b. Update Profile
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const userId = req.user.userId;
        const pool = await poolPromise;

        let query = 'UPDATE Users SET FullName = @fullName, Email = @email';
        const request = pool.request()
            .input('userId', sql.Int, userId)
            .input('fullName', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email);

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            query += ', PasswordHash = @passwordHash';
            request.input('passwordHash', sql.NVarChar, passwordHash);
        }

        query += ' WHERE UserID = @userId';
        await request.query(query);

        // Get updated user info
        const updatedUser = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT UserID, FullName, Email, Role FROM Users WHERE UserID = @userId');

        const user = updatedUser.recordset[0];
        res.json({
            message: 'Profil başarıyla güncellendi.',
            user: {
                id: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- FAVORITES ROUTES ---

// 3. Get User Favorites
app.get('/api/favorites', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT p.* FROM Favorites f
                JOIN Products p ON f.ProductID = p.ProductID
                WHERE f.UserID = @userId
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Add to Favorites
app.post('/api/favorites', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const pool = await poolPromise;

        // Check if already in favorites
        const check = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('productId', sql.Int, productId)
            .query('SELECT * FROM Favorites WHERE UserID = @userId AND ProductID = @productId');

        if (check.recordset.length > 0) {
            return res.status(400).json({ message: 'Bu ürün zaten favorilerinizde.' });
        }

        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('productId', sql.Int, productId)
            .query('INSERT INTO Favorites (UserID, ProductID) VALUES (@userId, @productId)');

        res.status(201).json({ message: 'Favorilere eklendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Remove from Favorites
app.delete('/api/favorites/:productId', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('productId', sql.Int, req.params.productId)
            .query('DELETE FROM Favorites WHERE UserID = @userId AND ProductID = @productId');

        res.json({ message: 'Favorilerden çıkarıldı.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCT ROUTES ---

// 1. Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Products ORDER BY UpdatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Add New Product
app.post('/api/products', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }
        const { name, brand, price, imageLink, description, productType, rating, stock, categoryId } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('brand', sql.NVarChar, brand)
            .input('price', sql.Decimal(18, 2), price)
            .input('imageLink', sql.NVarChar, imageLink)
            .input('description', sql.NVarChar, description)
            .input('productType', sql.NVarChar, productType)
            .input('rating', sql.Decimal(3, 2), null)
            .input('stock', sql.Int, stock)
            .input('categoryId', sql.Int, categoryId)
            .query(`INSERT INTO Products (Name, Brand, Price, ImageLink, Description, ProductType, Rating, Stock, CategoryID, CreatedAt, UpdatedAt)
                    VALUES (@name, @brand, @price, @imageLink, @description, @productType, @rating, @stock, @categoryId, GETDATE(), GETDATE())`);
        res.status(201).json({ message: 'Ürün başarıyla eklendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.1. Update Product
app.put('/api/products/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }
        const { name, brand, price, imageLink, description, productType, rating, stock, categoryId } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('name', sql.NVarChar, name)
            .input('brand', sql.NVarChar, brand)
            .input('price', sql.Decimal(18, 2), price)
            .input('imageLink', sql.NVarChar, imageLink)
            .input('description', sql.NVarChar, description)
            .input('productType', sql.NVarChar, productType)
            .input('rating', sql.Decimal(3, 2), rating)
            .input('stock', sql.Int, stock)
            .input('categoryId', sql.Int, categoryId)
            .query(`UPDATE Products
                    SET Name = @name, Brand = @brand, Price = @price, ImageLink = @imageLink,
                        Description = @description, ProductType = @productType,
                        Rating = @rating, Stock = @stock, CategoryID = @categoryId,
                        UpdatedAt = GETDATE()
                    WHERE ProductID = @id`);
        res.json({ message: 'Ürün başarıyla güncellendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete Product
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Products WHERE ProductID = @id');
        res.json({ message: 'Ürün silindi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Reviews for a Product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Reviews WHERE ProductID = @id ORDER BY CreatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Add New Review & Update Product Rating
app.post('/api/reviews', authMiddleware, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const pool = await poolPromise;

        // Get user details from DB to get the name (or use from token if available)
        const userResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT FullName FROM Users WHERE UserID = @userId');

        const userName = userResult.recordset[0]?.FullName || 'Misafir';

        // 1. Insert Review
        await pool.request()
            .input('productId', sql.Int, productId)
            .input('userName', sql.NVarChar, userName)
            .input('rating', sql.Int, rating)
            .input('comment', sql.NVarChar, comment)
            .query(`INSERT INTO Reviews (ProductID, UserName, Rating, Comment)
                    VALUES (@productId, @userName, @rating, @comment)`);

        // 2. Recalculate Average Rating and update Products table
        await pool.request()
            .input('productId', sql.Int, productId)
            .query(`UPDATE Products
                    SET Rating = (SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM Reviews WHERE ProductID = @productId)
                    WHERE ProductID = @productId`);

        res.status(201).json({ message: 'Yorumunuz başarıyla eklendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ORDER ROUTES ---

// 1. Place Order
app.post('/api/orders', authMiddleware, async (req, res) => {
    const { items, totalAmount, address, city, zip } = req.body;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // 1. Insert into Orders
            const orderRequest = new sql.Request(transaction);
            const orderResult = await orderRequest
                .input('userId', sql.Int, userId)
                .input('totalAmount', sql.Decimal(18, 2), totalAmount)
                .input('address', sql.NVarChar, address)
                .input('city', sql.NVarChar, city)
                .input('zip', sql.NVarChar, zip)
                .query(`
                    INSERT INTO Orders (UserID, TotalAmount, Address, City, Zip)
                    OUTPUT INSERTED.OrderID
                    VALUES (@userId, @totalAmount, @address, @city, @zip)
                `);

            const orderId = orderResult.recordset[0].OrderID;

            // 2. Insert into OrderItems
            for (const item of items) {
                const itemRequest = new sql.Request(transaction);
                await itemRequest
                    .input('orderId', sql.Int, orderId)
                    .input('productId', sql.Int, item.id)
                    .input('quantity', sql.Int, item.quantity || 1)
                    .input('price', sql.Decimal(18, 2), item.price)
                    .query(`
                        INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price)
                        VALUES (@orderId, @productId, @quantity, @price)
                    `);
            }

            await transaction.commit();
            res.status(201).json({ message: 'Sipariş başarıyla oluşturuldu!', orderId });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get User Orders
app.get('/api/orders', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT
                    o.OrderID,
                    o.OrderDate,
                    o.TotalAmount,
                    o.Status,
                    o.Address,
                    o.City,
                    (SELECT COUNT(*) FROM OrderItems WHERE OrderID = o.OrderID) as ItemCount
                FROM Orders o
                WHERE o.UserID = @userId
                ORDER BY o.OrderDate DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Recommended Product Types for User
app.get('/api/orders/recommendations', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        const userId = req.user.userId;

        if (!userId) {
            throw new Error('User ID missing in token');
        }

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT p.ProductType, COUNT(*) as TypeCount
                FROM Orders o
                JOIN OrderItems oi ON o.OrderID = oi.OrderID
                JOIN Products p ON oi.ProductID = p.ProductID
                WHERE o.UserID = @userId AND p.ProductType IS NOT NULL AND p.ProductType != ''
                GROUP BY p.ProductType
                ORDER BY TypeCount DESC
            `);

        console.log(`[DEBUG] User ${userId} - Raw SQL results:`, result.recordset);

        if (result.recordset.length === 0) {
            console.log(`[DEBUG] User ${userId} - No product types found`);
            return res.json({ types: [] });
        }

        // En yüksek count değerini bul
        const maxCount = result.recordset[0].TypeCount;
        console.log(`[DEBUG] User ${userId} - Max TypeCount:`, maxCount);
        console.log(`[DEBUG] User ${userId} - All records:`, result.recordset);

        // Sadece max count'a sahip türleri döndür (eşitlik varsa hepsi)
        const recommendedTypes = result.recordset
            .filter(row => row.TypeCount === maxCount)
            .map(row => row.ProductType)
            .filter(Boolean);

        console.log(`[DEBUG] User ${userId} - Final recommended types:`, recommendedTypes);

        res.json({ types: recommendedTypes });
    } catch (err) {
        console.error(`[ERROR] Recommendations fetch failed:`, err.message);
        console.error(`[ERROR] Stack:`, err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Order Details
app.get('/api/orders/:id', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        const orderResult = await pool.request()
            .input('orderId', sql.Int, req.params.id)
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT * FROM Orders WHERE OrderID = @orderId AND UserID = @userId');

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Sipariş bulunamadı.' });
        }

        const itemsResult = await pool.request()
            .input('orderId', sql.Int, req.params.id)
            .query(`
                SELECT oi.*, p.Name, p.ImageLink
                FROM OrderItems oi
                JOIN Products p ON oi.ProductID = p.ProductID
                WHERE oi.OrderID = @orderId
            `);

        res.json({
            ...orderResult.recordset[0],
            items: itemsResult.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ANALYTICS ---

app.get('/api/admin/stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }
        const pool = await poolPromise;

        // 1. KPI Stats
        const kpiQuery = `
            SELECT 
                ISNULL((SELECT SUM(TotalAmount) FROM Orders), 0) as totalRevenue,
                (SELECT COUNT(*) FROM Orders) as totalOrders,
                (SELECT COUNT(*) FROM Users) as totalUsers,
                (SELECT COUNT(*) FROM Products) as totalProducts
        `;
        const kpiResult = await pool.request().query(kpiQuery);

        // 2. Revenue Trend (Last 7 Days)
        const trendQuery = `
            SELECT 
                SUBSTRING(CONVERT(VARCHAR, OrderDate, 120), 1, 10) as date,
                SUM(TotalAmount) as revenue
            FROM Orders
            WHERE OrderDate >= DATEADD(day, -7, GETDATE())
            GROUP BY SUBSTRING(CONVERT(VARCHAR, OrderDate, 120), 1, 10)
            ORDER BY date
        `;
        const trendResult = await pool.request().query(trendQuery);

        // 3. Category Distribution (by Product Type)
        const categoryQuery = `
            SELECT 
                ProductType as name,
                COUNT(*) as value
            FROM Products
            GROUP BY ProductType
        `;
        const categoryResult = await pool.request().query(categoryQuery);

        // 4. Recent Orders
        const recentOrdersQuery = `
            SELECT TOP 5
                o.OrderID,
                u.FullName as customer,
                o.TotalAmount,
                o.Status,
                o.OrderDate
            FROM Orders o
            JOIN Users u ON o.UserID = u.UserID
            ORDER BY o.OrderDate DESC
        `;
        const recentOrdersResult = await pool.request().query(recentOrdersQuery);

        res.json({
            kpis: kpiResult.recordset[0],
            revenueData: trendResult.recordset,
            categoryData: categoryResult.recordset,
            recentOrders: recentOrdersResult.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
