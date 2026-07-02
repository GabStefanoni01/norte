/**
 * Runner simples de migrations: executa, em ordem, todos os arquivos .sql
 * de src/database/migrations contra o DATABASE_URL configurado no .env.
 * Funciona tanto para Postgres local (docker-compose) quanto para provedores
 * na nuvem (Neon, Supabase, etc.) — a conexão usa a mesma lógica de SSL
 * definida em pool.js.
 *
 * Uso: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const arquivos = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (arquivos.length === 0) {
    console.log('Nenhuma migration encontrada.');
    return;
  }

  console.log(`Executando ${arquivos.length} migration(s)...`);

  for (const arquivo of arquivos) {
    const caminho = path.join(MIGRATIONS_DIR, arquivo);
    const sql = fs.readFileSync(caminho, 'utf8');

    process.stdout.write(`  -> ${arquivo} ... `);
    await pool.query(sql);
    console.log('ok');
  }

  console.log('Migrations concluídas com sucesso.');
}

runMigrations()
  .catch((err) => {
    console.error('Falha ao rodar migrations:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
