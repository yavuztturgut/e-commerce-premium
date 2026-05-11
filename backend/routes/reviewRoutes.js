const express = require('express');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const pool = await poolPromise;

        const userResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT FullName FROM Users WHERE UserID = @userId');

        const userName = userResult.recordset[0]?.FullName || 'Misafir';

        await pool.request()
            .input('productId', sql.Int, productId)
            .input('userName', sql.NVarChar, userName)
            .input('rating', sql.Int, rating)
            .input('comment', sql.NVarChar, comment)
            .query(`INSERT INTO Reviews (ProductID, UserName, Rating, Comment)
                    VALUES (@productId, @userName, @rating, @comment)`);

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

module.exports = router;
