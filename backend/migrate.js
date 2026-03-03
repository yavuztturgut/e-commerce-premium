const fetch = require('node-fetch');
const { sql, poolPromise } = require('./db');

async function migrate() {
    console.log('⏳ Starting Migration...');
    try {
        const res = await fetch("https://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline");
        const data = await res.json();
        const pool = await poolPromise;

        for (const item of data) {
            await pool.request()
                .input('name', sql.NVarChar, item.name)
                .input('brand', sql.NVarChar, item.brand)
                .input('price', sql.Decimal(18, 2), Number(item.price) || 10.00)
                .input('imageLink', sql.NVarChar, item.api_featured_image || item.image_link)
                .input('description', sql.NVarChar, item.description)
                .input('productType', sql.NVarChar, item.product_type)
                .input('rating', sql.Decimal(3, 2), item.rating || 4.5)
                .input('stock', sql.Int, 20)
                .input('categoryId', sql.Int, 1) // Default to Makeup (ID 1)
                .query(`INSERT INTO Products (Name, Brand, Price, ImageLink, Description, ProductType, Rating, Stock, CategoryID) 
                        VALUES (@name, @brand, @price, @imageLink, @description, @productType, @rating, @stock, @categoryId)`);
            console.log(`✅ Saved: ${item.name}`);
        }
        console.log('✨ Migration Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

// Ensure node-fetch is available
// Note: Installing node-fetch v2 for commonjs support if needed, but here I used dynamic import simulation.
// Let's actually install node-fetch v2 for simplicity.
migrate();
