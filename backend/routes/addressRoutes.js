const express = require('express');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

const ensureAddressOwner = async (pool, addressId, userId) => {
    const check = await pool.request()
        .input('id', sql.Int, addressId)
        .input('userId', sql.Int, userId)
        .query('SELECT * FROM Addresses WHERE AddressID = @id AND UserID = @userId');

    return check.recordset.length > 0;
};

router.get('/', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT * FROM Addresses WHERE UserID = @userId ORDER BY CreatedAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, fullName, addressLine, city, zip } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('title', sql.NVarChar, title)
            .input('fullName', sql.NVarChar, fullName)
            .input('addressLine', sql.NVarChar, addressLine)
            .input('city', sql.NVarChar, city)
            .input('zip', sql.NVarChar, zip)
            .query(`INSERT INTO Addresses (UserID, Title, FullName, AddressLine, City, Zip)
                    VALUES (@userId, @title, @fullName, @addressLine, @city, @zip)`);
        res.status(201).json({ message: 'Adres başarıyla eklendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, fullName, addressLine, city, zip } = req.body;
        const pool = await poolPromise;

        const isOwner = await ensureAddressOwner(pool, req.params.id, req.user.userId);
        if (!isOwner) {
            return res.status(404).json({ message: 'Adres bulunamadı veya yetkiniz yok.' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('title', sql.NVarChar, title)
            .input('fullName', sql.NVarChar, fullName)
            .input('addressLine', sql.NVarChar, addressLine)
            .input('city', sql.NVarChar, city)
            .input('zip', sql.NVarChar, zip)
            .query(`UPDATE Addresses
                    SET Title = @title, FullName = @fullName, AddressLine = @addressLine, City = @city, Zip = @zip
                    WHERE AddressID = @id`);
        res.json({ message: 'Adres başarıyla güncellendi!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const pool = await poolPromise;

        const isOwner = await ensureAddressOwner(pool, req.params.id, req.user.userId);
        if (!isOwner) {
            return res.status(404).json({ message: 'Adres bulunamadı veya yetkiniz yok.' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Addresses WHERE AddressID = @id');
        res.json({ message: 'Adres silindi.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
