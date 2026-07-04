const request = require('supertest');
const app = require('../src/app');

describe('Rotas de /plans exigem autenticação', () => {
  it('POST /plans/gerar retorna 401 sem token', async () => {
    const res = await request(app).post('/plans/gerar');
    expect(res.status).toBe(401);
  });

  it('GET /plans/me retorna 401 sem token', async () => {
    const res = await request(app).get('/plans/me');
    expect(res.status).toBe(401);
  });

  it('PATCH /plans/:planId/itens/:itemId retorna 401 sem token', async () => {
    const res = await request(app).patch('/plans/1/itens/m1i1').send({ status: 'concluido' });
    expect(res.status).toBe(401);
  });
});
