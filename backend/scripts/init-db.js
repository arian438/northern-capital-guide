require('dotenv').config();
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const SOURCE_DB = process.env.DB_SOURCE_NAME || 'northen-capital-guide-app';
const TARGET_DB = process.env.DB_NAME || 'northern_capital_guide';

function findPgBinary(name) {
    const candidates = [
        path.join('C:', 'Program Files', 'PostgreSQL', '18', 'bin', `${name}.exe`),
        path.join('C:', 'Program Files', 'PostgreSQL', '17', 'bin', `${name}.exe`),
        path.join('C:', 'Program Files', 'PostgreSQL', '16', 'bin', `${name}.exe`),
        name
    ];

    return candidates.find((candidate) => candidate === name || fs.existsSync(candidate)) || name;
}

async function databaseExists(name) {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres'
    });

    await client.connect();
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    await client.end();
    return result.rowCount > 0;
}

async function createDatabase(name) {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: 'postgres'
    });

    await client.connect();
    await client.query(`CREATE DATABASE ${name}`);
    await client.end();
}

async function main() {
    if (!(await databaseExists(SOURCE_DB))) {
        console.error(`Source database "${SOURCE_DB}" not found.`);
        process.exit(1);
    }

    if (!(await databaseExists(TARGET_DB))) {
        console.log(`Creating database "${TARGET_DB}"...`);
        await createDatabase(TARGET_DB);
    }

    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };
    const pgDump = findPgBinary('pg_dump');
    const psql = findPgBinary('psql');

    const dump = spawnSync(
        pgDump,
        ['-U', process.env.DB_USER || 'postgres', '-h', process.env.DB_HOST || 'localhost', '-p', String(process.env.DB_PORT || 5432), '-d', SOURCE_DB, '--clean', '--if-exists'],
        { env, encoding: 'buffer' }
    );

    if (dump.status !== 0) {
        console.error(dump.stderr?.toString() || 'pg_dump failed');
        process.exit(1);
    }

    const restore = spawnSync(
        psql,
        ['-U', process.env.DB_USER || 'postgres', '-h', process.env.DB_HOST || 'localhost', '-p', String(process.env.DB_PORT || 5432), '-d', TARGET_DB],
        { env, input: dump.stdout }
    );

    if (restore.status !== 0) {
        console.error(restore.stderr?.toString() || 'psql restore failed');
        process.exit(1);
    }

    console.log(`Database "${TARGET_DB}" is ready.`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
