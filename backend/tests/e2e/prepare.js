const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const pool = require('../../src/database/pool');
const env = require('../../src/config/env');

const EMAIL = 'e2e.oportunidades@norte.test';
const PASSWORD = 'e2e-only-password';
const OPPORTUNITY_LINK = 'https://example.com/norte-e2e';

async function main() {
  await pool.query('DELETE FROM saved_opportunities WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [EMAIL]);
  await pool.query('DELETE FROM opportunities WHERE link = $1', [OPPORTUNITY_LINK]);
  await pool.query('DELETE FROM users WHERE email = $1', [EMAIL]);

  const user = await pool.query(
    `INSERT INTO users (nome, email, senha, idade, email_verificado, role)
     VALUES ('Usuário E2E', $1, 'e2e-not-used', 20, true, 'usuario')
     RETURNING id, nome, email, role`,
    [EMAIL],
  );

  const opportunity = await pool.query(
    `INSERT INTO opportunities
      (titulo, empresa, categoria, tipo, descricao, interesse, gratuito, requisitos, link, fonte, status)
     VALUES
      ('Oportunidade E2E Norte', 'Norte Testes', 'Tecnologia', 'vaga',
       'Oportunidade criada exclusivamente para validar o fluxo principal.',
       'Tecnologia', true, ARRAY[]::TEXT[], $1, 'manual', 'publicada')
     RETURNING id`,
    [OPPORTUNITY_LINK],
  );

  const usuario = user.rows[0];
  const token = jwt.sign(
    { sub: usuario.id, email: usuario.email, nome: usuario.nome, role: usuario.role },
    env.jwtSecret,
    { expiresIn: '1h' },
  );

  const output = path.resolve(__dirname, '../../../frontend/e2e/.auth.json');
  fs.writeFileSync(output, JSON.stringify({
    token,
    opportunityId: opportunity.rows[0].id,
    email: EMAIL,
    password: PASSWORD,
  }), 'utf8');

  console.log(JSON.stringify({ userId: usuario.id, opportunityId: opportunity.rows[0].id, output }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
