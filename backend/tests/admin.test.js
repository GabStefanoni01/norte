const request = require('supertest');
const app = require('../src/app');

describe('GET /admin/users', () => {
  it('retorna 401 sem token de autenticação', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(401);
  });
});
