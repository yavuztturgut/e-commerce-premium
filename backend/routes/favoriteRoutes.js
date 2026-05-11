const express = require('express');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT p.*, ISNULL(rc.ReviewCount, 0) AS ReviewCount FROM Favorites f
                JOIN Products p ON f.ProductID = p.ProductID
                OUTER APPLY (
                    SELECT COUNT(*) AS ReviewCount
                    FROM Reviews r
                    WHERE r.ProductID = p.ProductID
                ) rc
                WHERE f.UserID = @userId
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const pool = await poolPromise;

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

router.delete('/:productId', authMiddleware, async (req, res) => {
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

module.exports = router;
