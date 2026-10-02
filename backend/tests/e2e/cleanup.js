const pool = require('../../src/database/pool');

const EMAIL = 'e2e.oportunidades@norte.test';
const OPPORTUNITY_LINK = 'https://example.com/norte-e2e';

async function main() {
  await pool.query('DELETE FROM saved_opportunities WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [EMAIL]);
  await pool.query('DELETE FROM opportunities WHERE link = $1', [OPPORTUNITY_LINK]);
  await pool.query('DELETE FROM users WHERE email = $1', [EMAIL]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
