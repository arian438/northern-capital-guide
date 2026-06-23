require('dotenv').config();
const { Client } = require('pg');

function getClientConfig(database) {
    const connectionString =
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.POSTGRES_PRISMA_URL;

    if (connectionString) {
        const url = new URL(connectionString);
        if (database) url.pathname = `/${database}`;
        return {
            connectionString: url.toString(),
            ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
        };
    }

    return {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: database || 'postgres'
    };
}

async function main() {
    const admin = new Client(getClientConfig('postgres'));

    await admin.connect();
    const dbs = await admin.query(
        'SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname'
    );
    console.log('Databases:', dbs.rows.map((r) => r.datname).join(', '));

    const target = process.env.DB_NAME;
    if (target) {
        const exists = dbs.rows.some((r) => r.datname === target);
        console.log('Target DB_NAME:', target, exists ? '(exists)' : '(NOT FOUND)');
    }

    const poolClient = new Client(getClientConfig());
    await poolClient.connect();
    const tables = await poolClient.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'places'"
    );
    if (tables.rows.length) {
        const count = await poolClient.query('SELECT COUNT(*)::int AS n FROM places');
        console.log(`places table: rows=${count.rows[0].n}`);
    } else {
        console.log('places table: NOT FOUND');
    }
    await poolClient.end();
    await admin.end();
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
