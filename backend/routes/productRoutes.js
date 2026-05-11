const express = require('express');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

const requireAdmin = (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        return false;
    }
    return true;
};

router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.*, ISNULL(rc.ReviewCount, 0) AS ReviewCount
            FROM Products p
            OUTER APPLY (
                SELECT COUNT(*) AS ReviewCount
                FROM Reviews r
                WHERE r.ProductID = p.ProductID
            ) rc
            ORDER BY p.UpdatedAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const { name, brand, price, imageLink, description, productType, stock, categoryId } = req.body;
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

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const { name, brand, price, imageLink, description, productType, stock, categoryId } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('name', sql.NVarChar, name)
            .input('brand', sql.NVarChar, brand)
            .input('price', sql.Decimal(18, 2), price)
            .input('imageLink', sql.NVarChar, imageLink)
            .input('description', sql.NVarChar, description)
            .input('productType', sql.NVarChar, productType)
            .input('stock', sql.Int, stock)
            .input('categoryId', sql.Int, categoryId)
            .query(`UPDATE Products
                    SET Name = @name, Brand = @brand, Price = @price, ImageLink = @imageLink,
                        Description = @description, ProductType = @productType,
                        Rating = (SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM Reviews WHERE ProductID = @id),
                        Stock = @stock, CategoryID = @categoryId,
                        UpdatedAt = GETDATE()
                    WHERE ProductID = @id`);
        res.json({ message: 'Ürün başarıyla güncellendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const pool = await poolPromise;
        const productId = req.params.id;

        await pool.request().input('id', sql.Int, productId).query('DELETE FROM Favorites WHERE ProductID = @id');
        await pool.request().input('id', sql.Int, productId).query('DELETE FROM Reviews WHERE ProductID = @id');
        await pool.request().input('id', sql.Int, productId).query('DELETE FROM OrderItems WHERE ProductID = @id');

        const result = await pool.request()
            .input('id', sql.Int, productId)
            .query('DELETE FROM Products WHERE ProductID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        res.json({ message: 'Ürün silindi.' });
    } catch (err) {
        console.error('Ürün silme hatası:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/reviews', async (req, res) => {
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

module.exports = router;
