const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { sql, poolPromise } = require('./db');
const authMiddleware = require('./authMiddleware');

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

// 2. Login
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
                SELECT p.ProductType
                FROM Orders o
                JOIN OrderItems oi ON o.OrderID = oi.OrderID
                JOIN Products p ON oi.ProductID = p.ProductID
                WHERE o.UserID = @userId
                GROUP BY p.ProductType
            `);
        
        const recommendedTypes = result.recordset.map(row => row.ProductType).filter(Boolean);
        res.json({ types: recommendedTypes });
    } catch (err) {
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




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
