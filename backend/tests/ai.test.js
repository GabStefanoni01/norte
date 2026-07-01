const request = require('supertest');
const app = require('../src/app');

describe('POST /ai/chat', () => {
  it('retorna 401 sem token de autenticação', async () => {
    const res = await request(app).post('/ai/chat').send({ mensagem: 'oi' });
    expect(res.status).toBe(401);
  });
});
