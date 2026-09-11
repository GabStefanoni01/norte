const request = require('supertest');
const app = require('../src/app');

describe('Fluxo de verificação de e-mail e redefinição de senha', () => {
  it('POST /auth/verificar-email rejeita dados incompletos', async () => {
    const res = await request(app).post('/auth/verificar-email').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('E-mail inválido.');
  });

  it('POST /auth/esqueci-senha não revela se o e-mail existe', async () => {
    const res = await request(app).post('/auth/esqueci-senha').send({ email: 'nao-existe@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Se o e-mail existir em nossa base, um código foi enviado.');
  });
});
