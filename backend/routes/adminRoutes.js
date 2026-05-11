const express = require('express');
const { sql, poolPromise } = require('../db');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        const { startDate, endDate } = req.query;
        const pool = await poolPromise;

        const toLocalYMD = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        let dateFilter = 'WHERE 1=1';
        let trendFilter = 'WHERE o.OrderDate >= DATEADD(day, -7, GETDATE())';
        let start = new Date();
        start.setDate(start.getDate() - 7);
        let end = new Date();

        if (startDate && endDate) {
            dateFilter = 'WHERE o.OrderDate >= @start AND o.OrderDate <= @end';
            trendFilter = 'WHERE o.OrderDate >= @start AND o.OrderDate <= @end';
            const [sY, sM, sD] = startDate.split('-').map(Number);
            const [eY, eM, eD] = endDate.split('-').map(Number);
            start = new Date(sY, sM - 1, sD);
            end = new Date(eY, eM - 1, eD);
        }

        const startParam = new Date(start);
        startParam.setHours(0, 0, 0, 0);
        const endParam = new Date(end);
        endParam.setHours(23, 59, 59, 999);

        const kpiRequest = pool.request();
        if (startDate && endDate) {
            kpiRequest.input('start', sql.DateTime, startParam);
            kpiRequest.input('end', sql.DateTime, endParam);
        }
        const kpiResult = await kpiRequest.query(`
            SELECT
                ISNULL((SELECT SUM(TotalAmount) FROM Orders o ${dateFilter}), 0) as totalRevenue,
                (SELECT COUNT(*) FROM Orders o ${dateFilter}) as totalOrders,
                (SELECT COUNT(*) FROM Users) as totalUsers,
                (SELECT COUNT(*) FROM Products) as totalProducts
        `);

        const trendRequest = pool.request();
        if (startDate && endDate) {
            trendRequest.input('start', sql.DateTime, startParam);
            trendRequest.input('end', sql.DateTime, endParam);
        }
        const trendResult = await trendRequest.query(`
            SELECT
                SUBSTRING(CONVERT(VARCHAR, o.OrderDate, 120), 1, 10) as date,
                SUM(o.TotalAmount) as revenue
            FROM Orders o
            ${trendFilter}
            GROUP BY SUBSTRING(CONVERT(VARCHAR, o.OrderDate, 120), 1, 10)
            ORDER BY date
        `);

        const trendMap = {};
        trendResult.recordset.forEach(row => {
            trendMap[row.date] = row.revenue;
        });

        const filledTrendData = [];
        let curr = new Date(start);
        curr.setHours(0, 0, 0, 0);
        const last = new Date(end);
        last.setHours(0, 0, 0, 0);

        while (curr <= last && filledTrendData.length < 366) {
            const dateStr = toLocalYMD(curr);
            filledTrendData.push({
                date: dateStr,
                revenue: trendMap[dateStr] || 0
            });
            curr.setDate(curr.getDate() + 1);
        }

        const categoryResult = await pool.request().query(`
            SELECT ProductType as name, COUNT(*) as value FROM Products GROUP BY ProductType
        `);

        const recentRequest = pool.request();
        if (startDate && endDate) {
            recentRequest.input('start', sql.DateTime, startParam);
            recentRequest.input('end', sql.DateTime, endParam);
        }
        const recentOrdersResult = await recentRequest.query(`
            SELECT TOP 5 o.OrderID, u.FullName as customer, o.TotalAmount, o.Status, o.OrderDate
            FROM Orders o JOIN Users u ON o.UserID = u.UserID
            ${dateFilter} ORDER BY o.OrderDate DESC
        `);

        res.json({
            kpis: kpiResult.recordset[0],
            revenueData: filledTrendData,
            categoryData: categoryResult.recordset,
            recentOrders: recentOrdersResult.recordset
        });
    } catch (err) {
        console.error('[STATS ERROR]:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
