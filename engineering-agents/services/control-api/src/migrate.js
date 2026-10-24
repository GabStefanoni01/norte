'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL não está configurada. Verifique o arquivo .env de engineering-agents.');
  process.exit(1);
}

const migrationsDirectory = path.join(__dirname, '..', 'migrations');
const lockKey = 741_923_118;
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 5000,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined,
});

async function runMigrations() {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query('SELECT pg_advisory_lock($1)', [lockKey]);
    lockAcquired = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.engineering_agents_schema_migrations (
        name TEXT PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs.readdirSync(migrationsDirectory)
      .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name))
      .sort();

    if (files.length === 0) {
      console.log('Nenhuma migração encontrada.');
      return;
    }

    for (const name of files) {
      const sql = fs.readFileSync(path.join(migrationsDirectory, name), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const existing = await client.query(
        'SELECT checksum FROM public.engineering_agents_schema_migrations WHERE name = $1',
        [name],
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum.trim() !== checksum) {
          throw new Error(`A migração já aplicada foi alterada: ${name}. Crie uma nova migração em vez de editar a anterior.`);
        }
        console.log(`[skip] ${name} já aplicada`);
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO public.engineering_agents_schema_migrations (name, checksum) VALUES ($1, $2)',
          [name, checksum],
        );
        await client.query('COMMIT');
        console.log(`[applied] ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('Migrações concluídas.');
  } finally {
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [lockKey]);
      } catch {
        // A conexão pode já ter sido encerrada pelo banco.
      }
    }
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error(JSON.stringify({
    event: 'migration_failed',
    name: error?.name || 'Error',
    message: error?.message || 'Erro desconhecido durante a migração',
    code: error?.code,
  }));
  process.exitCode = 1;
});
