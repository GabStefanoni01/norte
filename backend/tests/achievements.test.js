const request = require('supertest');
const app = require('../src/app');

describe('GET /achievements/me', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/achievements/me');
    expect(res.status).toBe(401);
  });
});
