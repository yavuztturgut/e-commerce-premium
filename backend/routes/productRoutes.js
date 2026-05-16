const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
const allowedImageTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif']
]);
const maxImageSizeBytes = 5 * 1024 * 1024;

const requireAdmin = (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        return false;
    }
    return true;
};

router.post('/upload-image', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const { fileName, dataUrl } = req.body;
        const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');

        if (!match) {
            return res.status(400).json({ message: 'Geçerli bir resim dosyası seçin.' });
        }

        const mimeType = match[1].toLowerCase();
        const extension = allowedImageTypes.get(mimeType);
        if (!extension) {
            return res.status(400).json({ message: 'Sadece JPG, PNG, WEBP veya GIF yükleyebilirsiniz.' });
        }

        const imageBuffer = Buffer.from(match[2], 'base64');
        if (imageBuffer.length > maxImageSizeBytes) {
            return res.status(400).json({ message: 'Resim boyutu en fazla 5 MB olmalı.' });
        }

        fs.mkdirSync(uploadDir, { recursive: true });
        const safeBaseName = path.basename(fileName || 'product').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40) || 'product';
        const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeBaseName}.${extension}`;
        const storedPath = path.join(uploadDir, storedName);

        fs.writeFileSync(storedPath, imageBuffer);

        res.status(201).json({
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/products/${storedName}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
            WHERE ISNULL(p.IsActive, 1) = 1
            ORDER BY p.UpdatedAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.*, ISNULL(rc.ReviewCount, 0) AS ReviewCount
            FROM Products p
            OUTER APPLY (
                SELECT COUNT(*) AS ReviewCount
                FROM Reviews r
                WHERE r.ProductID = p.ProductID
            ) rc
            ORDER BY ISNULL(p.IsActive, 1) DESC, p.UpdatedAt DESC
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
            .input('stock', sql.Int, Math.max(0, Number(stock) || 0))
            .input('categoryId', sql.Int, categoryId)
            .query(`INSERT INTO Products (Name, Brand, Price, ImageLink, Description, ProductType, Rating, Stock, CategoryID, IsActive, CreatedAt, UpdatedAt)
                    VALUES (@name, @brand, @price, @imageLink, @description, @productType, @rating, @stock, @categoryId, 1, GETDATE(), GETDATE())`);
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
            .input('stock', sql.Int, Math.max(0, Number(stock) || 0))
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

router.patch('/:id/deactivate', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const result = await (await poolPromise).request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE Products
                SET IsActive = 0, DeletedAt = GETDATE(), UpdatedAt = GETDATE()
                WHERE ProductID = @id AND ISNULL(IsActive, 1) = 1
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Aktif ürün bulunamadı.' });
        }

        res.json({ message: 'Ürün pasife alındı.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/activate', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const result = await (await poolPromise).request()
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE Products
                SET IsActive = 1, DeletedAt = NULL, UpdatedAt = GETDATE()
                WHERE ProductID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        res.json({ message: 'Ürün tekrar aktif edildi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;

        const pool = await poolPromise;
        const productId = req.params.id;

        const orderItemCheck = await pool.request()
            .input('id', sql.Int, productId)
            .query('SELECT TOP 1 OrderItemID FROM OrderItems WHERE ProductID = @id');

        if (orderItemCheck.recordset.length > 0) {
            return res.status(409).json({
                message: 'Bu ürün sipariş geçmişinde kullanıldığı için kökten silinemez. Pasife alabilirsiniz.'
            });
        }

        await pool.request().input('id', sql.Int, productId).query('DELETE FROM Favorites WHERE ProductID = @id');
        await pool.request().input('id', sql.Int, productId).query('DELETE FROM Reviews WHERE ProductID = @id');

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
