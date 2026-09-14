const { Pool } = require('pg');
const env = require('../config/env');
const logger = require('../utils/logger');

const exigeSSL = /sslmode=require/.test(env.databaseUrl || '');
const ssl = exigeSSL ? { rejectUnauthorized: process.env.DB_SSL_INSECURE !== 'true' } : false;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl,
  max: env.dbPoolMax,
  idleTimeoutMillis: env.dbIdleTimeoutMs,
  connectionTimeoutMillis: env.dbConnectionTimeoutMs,
});

pool.on('error', (err) => logger.error('database.pool.unexpected_error', err));

module.exports = pool;
