const request = require('supertest');

jest.mock('../src/database/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../src/database/pool');
const app = require('../src/app');

describe('Health checks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /health retorna 200 sem depender do banco', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('uptimeSeconds');
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('GET /ready retorna 200 quando o banco e o schema estão disponíveis', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        users: 'users',
        opportunities: 'opportunities',
        saved_opportunities: 'saved_opportunities',
      }],
    });

    const response = await request(app).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ready' });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('GET /ready retorna 503 quando uma tabela obrigatória não existe', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        users: 'users',
        opportunities: 'opportunities',
        saved_opportunities: null,
      }],
    });

    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'unavailable',
      reason: 'database_schema_incomplete',
    });
  });

  it('GET /ready retorna 503 quando o banco está indisponível', async () => {
    pool.query.mockRejectedValueOnce(new Error('database unavailable'));

    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'unavailable' });
  });
});
