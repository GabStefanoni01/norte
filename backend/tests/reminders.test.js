const request = require('supertest');
const app = require('../src/app');

describe('POST /admin/lembretes/enviar', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/admin/lembretes/enviar');
    expect(res.status).toBe(401);
  });
});
