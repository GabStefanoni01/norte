const { Pool } = require('pg');
const env = require('../config/env');

// Provedores de Postgres na nuvem (Neon, Supabase, etc.) exigem SSL e
// costumam incluir "sslmode=require" na connection string. Localmente
// (docker-compose ou Postgres instalado direto) isso não é necessário.
const exigeSSL = /sslmode=require/.test(env.databaseUrl || '');

// rejectUnauthorized: true por padrão — Neon, Supabase e a maioria dos
// provedores usam certificados de CA públicas confiáveis, então isso
// funciona sem configuração extra. Deixar como false (como estava antes)
// desliga a verificação do certificado, abrindo brecha pra man-in-the-middle
// na conexão com o banco. Só desative via DB_SSL_INSECURE=true se seu
// provedor específico usar certificado autoassinado (não é o caso comum).
const ssl = exigeSSL ? { rejectUnauthorized: process.env.DB_SSL_INSECURE !== 'true' } : false;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões do PostgreSQL:', err.message);
});

pool.on('connect', () => {
  // Conexão bem-sucedida — útil para confirmar rapidamente em ambiente local
  // que o banco (ex: via docker-compose) está de pé.
});

module.exports = pool;
