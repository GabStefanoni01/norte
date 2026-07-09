const { Pool } = require('pg');
const env = require('../config/env');

// Provedores de Postgres na nuvem (Neon, Supabase, etc.) exigem SSL e
// costumam incluir "sslmode=require" na connection string. Localmente
// (docker-compose ou Postgres instalado direto) isso não é necessário.
const exigeSSL = /sslmode=require/.test(env.databaseUrl || '');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: exigeSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões do PostgreSQL:', err.message);
});

pool.on('connect', () => {
  // Conexão bem-sucedida — útil para confirmar rapidamente em ambiente local
  // que o banco (ex: via docker-compose) está de pé.
});

module.exports = pool;
