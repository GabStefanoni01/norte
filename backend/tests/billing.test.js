const request = require('supertest');
const app = require('../src/app');

describe('Rotas de /billing exigem autenticação (exceto webhook)', () => {
  it('POST /billing/assinar retorna 401 sem token', async () => {
    const res = await request(app).post('/billing/assinar');
    expect(res.status).toBe(401);
  });

  it('GET /billing/status retorna 401 sem token', async () => {
    const res = await request(app).get('/billing/status');
    expect(res.status).toBe(401);
  });

  it('POST /billing/webhook aceita sem token (endpoint publico)', async () => {
    const res = await request(app).post('/billing/webhook').send({ type: 'test' });
    expect(res.status).toBe(200);
  });
});
