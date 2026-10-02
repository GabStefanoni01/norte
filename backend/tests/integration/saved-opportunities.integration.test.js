const pool = require('../../src/database/pool');
const savedService = require('../../src/modules/opportunities/saved-opportunities.service');

const describeIntegration = process.env.INTEGRATION_TESTS === 'true' ? describe : describe.skip;

describeIntegration('saved opportunities — integração PostgreSQL', () => {
  let userId;
  let opportunityId;
  const email = `integration.saved.${Date.now()}@norte.test`;

  beforeAll(async () => {
    const user = await pool.query(
      `INSERT INTO users (nome, email, senha, idade)
       VALUES ('Usuário de integração', $1, 'integration-test-hash', 20)
       RETURNING id`,
      [email],
    );
    userId = user.rows[0].id;

    const opportunity = await pool.query(
      `INSERT INTO opportunities
        (titulo, empresa, categoria, tipo, descricao, interesse, gratuito, requisitos, link, fonte, status)
       VALUES
        ('Oportunidade de integração', 'Norte Testes', 'Tecnologia', 'vaga',
         'Registro criado exclusivamente para os testes de integração.',
         'Tecnologia', true, ARRAY['JavaScript']::TEXT[],
         'https://example.com/integration-test', 'manual', 'publicada')
       RETURNING id`,
    );
    opportunityId = opportunity.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM saved_opportunities WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM opportunities WHERE id = $1', [opportunityId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  it('executa o fluxo real de salvar, listar e verificar', async () => {
    const salvo = await savedService.salvar(userId, opportunityId);

    expect(salvo.opportunity_id).toBe(opportunityId);
    expect(salvo.id).toEqual(expect.any(Number));

    const salvas = await savedService.listar(userId);
    expect(salvas).toHaveLength(1);
    expect(salvas[0].id).toBe(opportunityId);

    await expect(savedService.verificar(userId, opportunityId)).resolves.toBe(true);
  });

  it('mantém o save idempotente quando a mesma oportunidade é salva novamente', async () => {
    const primeiro = await savedService.salvar(userId, opportunityId);
    const segundo = await savedService.salvar(userId, opportunityId);

    expect(segundo.id).toBe(primeiro.id);

    const count = await pool.query(
      'SELECT COUNT(*)::int AS total FROM saved_opportunities WHERE user_id = $1 AND opportunity_id = $2',
      [userId, opportunityId],
    );
    expect(count.rows[0].total).toBe(1);
  });

  it('não salva oportunidade expirada', async () => {
    const opportunity = await pool.query(
      `INSERT INTO opportunities
        (titulo, empresa, categoria, tipo, descricao, interesse, gratuito, requisitos, link, fonte, status, expires_at)
       VALUES
        ('Oportunidade expirada', 'Norte Testes', 'Tecnologia', 'vaga',
         'Registro expirado para teste.',
         'Tecnologia', true, ARRAY[]::TEXT[],
         'https://example.com/integration-expired', 'manual', 'publicada', NOW() - INTERVAL '1 day')
       RETURNING id`,
    );

    const expiredId = opportunity.rows[0].id;

    await expect(savedService.salvar(userId, expiredId)).rejects.toMatchObject({
      status: 404,
    });

    await pool.query('DELETE FROM opportunities WHERE id = $1', [expiredId]);
  });

  it('remove o save e confirma que não existe mais', async () => {
    await savedService.salvar(userId, opportunityId);

    await expect(savedService.remover(userId, opportunityId)).resolves.toBe(true);
    await expect(savedService.verificar(userId, opportunityId)).resolves.toBe(false);
  });
});
