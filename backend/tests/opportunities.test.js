const request = require('supertest');
const app = require('../src/app');

describe('Rotas de /opportunities', () => {
  it('GET /opportunities retorna 401 sem token', async () => {
    expect((await request(app).get('/opportunities')).status).toBe(401);
  });
  it('POST /opportunities retorna 401 sem token', async () => {
    expect((await request(app).post('/opportunities').send({ titulo: 'x', link: 'https://x.com' })).status).toBe(401);
  });
  it('POST /opportunities/:id/fechar-lacuna retorna 401 sem token', async () => {
    expect((await request(app).post('/opportunities/1/fechar-lacuna')).status).toBe(401);
  });
});
