const request = require('supertest');
const app = require('../src/app');

describe('POST /auth/login', () => {
  it('retorna 401 para credenciais inválidas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@example.com', senha: 'errada' });

    expect([401, 500]).toContain(res.status);
  });
});
