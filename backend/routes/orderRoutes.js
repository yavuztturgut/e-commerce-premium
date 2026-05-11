const express = require('express');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    const { items, totalAmount, address, city, zip } = req.body;
    const userId = req.user.userId;

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
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

router.get('/', authMiddleware, async (req, res) => {
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

router.get('/recommendations', authMiddleware, async (req, res) => {
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

        if (result.recordset.length === 0) {
            return res.json({ types: [] });
        }

        const maxCount = result.recordset[0].TypeCount;
        const recommendedTypes = result.recordset
            .filter(row => row.TypeCount === maxCount)
            .map(row => row.ProductType)
            .filter(Boolean);

        res.json({ types: recommendedTypes });
    } catch (err) {
        console.error('[ERROR] Recommendations fetch failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
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

module.exports = router;
