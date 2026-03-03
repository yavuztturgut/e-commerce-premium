const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sql, poolPromise } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Get All Products
app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Products');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Add New Product
app.post('/api/products', async (req, res) => {
    try {
        const { name, brand, price, imageLink, description, productType, rating, stock, categoryId } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('brand', sql.NVarChar, brand)
            .input('price', sql.Decimal(18, 2), price)
            .input('imageLink', sql.NVarChar, imageLink)
            .input('description', sql.NVarChar, description)
            .input('productType', sql.NVarChar, productType)
            .input('rating', sql.Decimal(3, 2), rating)
            .input('stock', sql.Int, stock)
            .input('categoryId', sql.Int, categoryId)
            .query(`INSERT INTO Products (Name, Brand, Price, ImageLink, Description, ProductType, Rating, Stock, CategoryID) 
                    VALUES (@name, @brand, @price, @imageLink, @description, @productType, @rating, @stock, @categoryId)`);
        res.status(201).json({ message: 'Ürün başarıyla eklendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
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
app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, userName, rating, comment } = req.body;
        const pool = await poolPromise;

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

        res.status(201).json({ message: 'Yorum ve Ürün Puanı başarıyla güncellendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
