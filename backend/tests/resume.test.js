const request = require('supertest');
const app = require('../src/app');

describe('Rotas de /resume exigem autenticação', () => {
  it('POST /resume/gerar retorna 401 sem token', async () => {
    const res = await request(app).post('/resume/gerar');
    expect(res.status).toBe(401);
  });

  it('GET /resume/me retorna 401 sem token', async () => {
    const res = await request(app).get('/resume/me');
    expect(res.status).toBe(401);
  });

  it('GET /resume/entrevista/perguntas retorna 401 sem token', async () => {
    const res = await request(app).get('/resume/entrevista/perguntas');
    expect(res.status).toBe(401);
  });

  it('POST /resume/entrevista/feedback retorna 401 sem token', async () => {
    const res = await request(app).post('/resume/entrevista/feedback').send({ respostas: [] });
    expect(res.status).toBe(401);
  });
});
