require('dotenv').config();
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SOURCE_DB = process.env.DB_SOURCE_NAME || process.env.DB_NAME || 'northern_capital_guide';
const TARGET_URL =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

function findPgBinary(name) {
    const candidates = [
        path.join('C:', 'Program Files', 'PostgreSQL', '18', 'bin', `${name}.exe`),
        path.join('C:', 'Program Files', 'PostgreSQL', '17', 'bin', `${name}.exe`),
        path.join('C:', 'Program Files', 'PostgreSQL', '16', 'bin', `${name}.exe`),
        name
    ];
    return candidates.find((c) => c === name || fs.existsSync(c)) || name;
}

function main() {
    if (!TARGET_URL) {
        console.error('Укажите DATABASE_URL — строку подключения к облачной БД.');
        console.error('Пример: DATABASE_URL=postgresql://user:pass@host/db?sslmode=require node scripts/push-to-cloud.js');
        process.exit(1);
    }

    const pgDump = findPgBinary('pg_dump');
    const psql = findPgBinary('psql');
    const env = { ...process.env, PGPASSWORD: process.env.DB_PASSWORD };

    console.log(`Экспорт из локальной БД "${SOURCE_DB}"...`);
    const dump = spawnSync(
        pgDump,
        [
            '-U', process.env.DB_USER || 'postgres',
            '-h', process.env.DB_HOST || 'localhost',
            '-p', String(process.env.DB_PORT || 5432),
            '-d', SOURCE_DB,
            '--clean',
            '--if-exists',
            '--no-owner',
            '--no-acl'
        ],
        { env, encoding: 'buffer' }
    );

    if (dump.status !== 0) {
        console.error(dump.stderr?.toString() || 'pg_dump failed');
        process.exit(1);
    }

    console.log('Импорт в облачную БД...');
    const restore = spawnSync(psql, [TARGET_URL], {
        input: dump.stdout,
        encoding: 'utf8'
    });

    if (restore.status !== 0) {
        console.error(restore.stderr || restore.stdout || 'psql restore failed');
        process.exit(1);
    }

    console.log('Готово! Данные загружены в облачную БД.');
    console.log('Добавьте DATABASE_URL в Vercel → Settings → Environment Variables и сделайте Redeploy.');
}

main();
