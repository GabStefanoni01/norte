const request = require('supertest');
const app = require('../src/app');

describe('Rotas de /opportunities', () => {
  it('GET /opportunities retorna 401 sem token', async () => {
    const res = await request(app).get('/opportunities');
    expect(res.status).toBe(401);
  });

  it('POST /opportunities retorna 401 sem token', async () => {
    const res = await request(app).post('/opportunities').send({ titulo: 'x', link: 'https://x.com' });
    expect(res.status).toBe(401);
  });
});
