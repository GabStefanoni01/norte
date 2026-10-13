const fs = require('fs');
const path = require('path');
const pool = require('../../src/database/pool');

const EMAIL = 'e2e.oportunidades@norte.test';
const OPPORTUNITY_LINK = 'https://example.com/norte-e2e';
const AUTH_FILE = path.resolve(__dirname, '../../../frontend/e2e/.auth.json');

async function main() {
  try {
    await pool.query(
      'DELETE FROM saved_opportunities WHERE user_id IN (SELECT id FROM users WHERE email = $1)',
      [EMAIL],
    );
    await pool.query('DELETE FROM opportunities WHERE link = $1', [OPPORTUNITY_LINK]);
    await pool.query('DELETE FROM users WHERE email = $1', [EMAIL]);
  } finally {
    // O token E2E é temporário e deve ser removido mesmo se a limpeza do banco falhar.
    fs.rmSync(AUTH_FILE, { force: true });
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Falha ao limpar dados E2E:', error);
  process.exitCode = 1;
});
