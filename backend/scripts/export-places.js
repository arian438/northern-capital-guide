require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'northern_capital_guide'
    });

    await client.connect();
    const result = await client.query(
        `SELECT id, name, category, short_desc, full_desc, address, metro,
                hours, lat, lng, photo_url, rating, reviews_count, created_at, updated_at
         FROM places ORDER BY id`
    );
    await client.end();

    const outDir = path.join(__dirname, '../data');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'places.json');
    fs.writeFileSync(outPath, JSON.stringify(result.rows, null, 2), 'utf8');
    console.log(`Exported ${result.rows.length} places to ${outPath}`);
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
