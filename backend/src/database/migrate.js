/**
 * Runner de migrations com controle de quais já foram aplicadas (tabela
 * schema_migrations), pra rodar com segurança várias vezes — necessário
 * porque algumas migrations usam ADD CONSTRAINT, que não é idempotente
 * (rodar duas vezes quebraria com "constraint already exists").
 *
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

async function garantirTabelaDeControle() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function buscarJaAplicadas() {
  const result = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map((r) => r.filename));
}

async function runMigrations() {
  await garantirTabelaDeControle();
  const jaAplicadas = await buscarJaAplicadas();

  const arquivos = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pendentes = arquivos.filter((f) => !jaAplicadas.has(f));

  if (pendentes.length === 0) {
    console.log('Nenhuma migration pendente — banco já está atualizado.');
    return;
  }

  console.log(`Executando ${pendentes.length} migration(s) pendente(s)...`);

  for (const arquivo of pendentes) {
    const caminho = path.join(MIGRATIONS_DIR, arquivo);
    const sql = fs.readFileSync(caminho, 'utf8');

    process.stdout.write(`  -> ${arquivo} ... `);
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [arquivo]);
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
