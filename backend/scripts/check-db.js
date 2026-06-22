require('dotenv').config();
const { Client } = require('pg');

async function main() {
    const admin = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres'
    });

    await admin.connect();
    const dbs = await admin.query(
        'SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname'
    );
    console.log('Databases:', dbs.rows.map((r) => r.datname).join(', '));

    const target = process.env.DB_NAME;
    const exists = dbs.rows.some((r) => r.datname === target);
    console.log('Target DB_NAME:', target, exists ? '(exists)' : '(NOT FOUND)');

    for (const name of dbs.rows.map((r) => r.datname)) {
        if (name === 'postgres') continue;
        try {
            const c = new Client({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: name
            });
            await c.connect();
            const tables = await c.query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'places'"
            );
            if (tables.rows.length) {
                const count = await c.query('SELECT COUNT(*)::int AS n FROM places');
                console.log(`  ${name}: has places table, rows=${count.rows[0].n}`);
            }
            await c.end();
        } catch (e) {
            console.log(`  ${name}: check failed - ${e.message}`);
        }
    }

    await admin.end();
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
