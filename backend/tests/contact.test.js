const request = require('supertest');
const app = require('../src/app');

describe('POST /contact', () => {
  it('rejeita nome invalido', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ nome: 'a', email: 'teste@exemplo.com', mensagem: 'Olá, gostaria de saber mais.' });
    expect(res.status).toBe(400);
  });

  it('rejeita email invalido', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ nome: 'Ana Silva', email: 'nao-e-email', mensagem: 'Olá, gostaria de saber mais.' });
    expect(res.status).toBe(400);
  });

  it('rejeita mensagem muito curta', async () => {
    const res = await request(app)
      .post('/contact')
      .send({ nome: 'Ana Silva', email: 'teste@exemplo.com', mensagem: 'oi' });
    expect(res.status).toBe(400);
  });
});
