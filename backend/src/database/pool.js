const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões do PostgreSQL:', err.message);
});

pool.on('connect', () => {
  // Conexão bem-sucedida — útil para confirmar rapidamente em ambiente local
  // que o banco (ex: via docker-compose) está de pé.
});

module.exports = pool;
