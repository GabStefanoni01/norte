jest.mock('../src/database/pool', () => ({
  query: jest.fn(),
}));

jest.mock('../src/database/redis', () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
}));

jest.mock('../src/modules/opportunities/opportunities.collector', () => ({
  sincronizarJobs: jest.fn(),
}));

jest.mock('../src/config/env', () => ({
  opportunityJobMaxRetries: 2,
  opportunityJobRetryBaseDelayMs: 1,
}));

const pool = require('../src/database/pool');
const redis = require('../src/database/redis');
const { sincronizarJobs } = require('../src/modules/opportunities/opportunities.collector');
const {
  dispararSincronizacao,
  executarSincronizacao,
  erroEhRetentavel,
  calcularDelay,
} = require('../src/modules/opportunities/opportunities.job');

describe('opportunities job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockResolvedValue({ rows: [] });
  });

  it('não agenda uma segunda execução quando o lock já está ocupado', async () => {
    redis.acquireLock.mockResolvedValue(null);

    await expect(dispararSincronizacao()).resolves.toEqual({ status: 'already_running' });
    expect(sincronizarJobs).not.toHaveBeenCalled();
  });

  it('agenda a sincronização e libera o lock ao terminar', async () => {
    redis.acquireLock.mockResolvedValue('token');
    sincronizarJobs.mockResolvedValue({ encontrados: 2 });

    await expect(dispararSincronizacao()).resolves.toEqual({ status: 'queued' });

    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(sincronizarJobs).toHaveBeenCalledTimes(1);
    expect(redis.releaseLock).toHaveBeenCalledWith('lock:oportunidades', 'token');
    expect(pool.query).toHaveBeenCalled();
  });

  it('classifica apenas falhas transitórias como retentáveis', () => {
    expect(erroEhRetentavel({ code: 'EXTERNAL_TIMEOUT' })).toBe(true);
    expect(erroEhRetentavel({ code: 'CIRCUIT_OPEN' })).toBe(true);
    expect(erroEhRetentavel({ status: 429 })).toBe(true);
    expect(erroEhRetentavel({ status: 503 })).toBe(true);
    expect(erroEhRetentavel({ status: 401 })).toBe(false);
    expect(erroEhRetentavel({ status: 404 })).toBe(false);
  });

  it('calcula backoff exponencial', () => {
    expect(calcularDelay(1)).toBe(1);
    expect(calcularDelay(2)).toBe(2);
    expect(calcularDelay(3)).toBe(4);
  });

  it('repete falha transitória e depois conclui com sucesso', async () => {
    sincronizarJobs
      .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'EXTERNAL_TIMEOUT' }))
      .mockRejectedValueOnce(Object.assign(new Error('indisponível'), { status: 503 }))
      .mockResolvedValueOnce({ encontrados: 3 });

    await expect(executarSincronizacao()).resolves.toEqual({ encontrados: 3 });

    expect(sincronizarJobs).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenCalled();
  });

  it('não repete falha não transitória e marca como failed', async () => {
    sincronizarJobs.mockRejectedValue(Object.assign(new Error('não autorizado'), { status: 401 }));

    await expect(executarSincronizacao()).rejects.toThrow('não autorizado');

    expect(sincronizarJobs).toHaveBeenCalledTimes(1);

    const chamadas = pool.query.mock.calls.map(([sql]) => sql);
    expect(chamadas.some((sql) => sql.includes('ultima_falha_mensagem'))).toBe(true);
  });

  it('marca a execução como falha após esgotar as tentativas', async () => {
    sincronizarJobs.mockRejectedValue(Object.assign(new Error('JobsPipe indisponível'), { status: 503 }));

    await expect(executarSincronizacao()).rejects.toThrow('JobsPipe indisponível');

    expect(sincronizarJobs).toHaveBeenCalledTimes(3);

    const chamadas = pool.query.mock.calls.map(([sql]) => sql);
    expect(chamadas.some((sql) => sql.includes('ultima_falha_mensagem'))).toBe(true);
  });
});
