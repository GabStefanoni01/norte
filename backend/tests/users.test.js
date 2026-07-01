const request = require('supertest');
const app = require('../src/app');

describe('GET /users/:id', () => {
  it('retorna 401 sem token de autenticação', async () => {
    const res = await request(app).get('/users/1');
    expect(res.status).toBe(401);
  });
});
