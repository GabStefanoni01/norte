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

  it('GET /opportunities/todas retorna 401 sem token', async () => {
    const res = await request(app).get('/opportunities/todas');
    expect(res.status).toBe(401);
  });

  it('POST /opportunities/buscar-na-web retorna 401 sem token', async () => {
    const res = await request(app).post('/opportunities/buscar-na-web');
    expect(res.status).toBe(401);
  });

  it('PATCH /opportunities/:id/status retorna 401 sem token', async () => {
    const res = await request(app).patch('/opportunities/1/status').send({ status: 'publicada' });
    expect(res.status).toBe(401);
  });
});
