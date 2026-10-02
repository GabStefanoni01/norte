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

const pool = require('../src/database/pool');
const redis = require('../src/database/redis');
const { sincronizarJobs } = require('../src/modules/opportunities/opportunities.collector');
const { dispararSincronizacao, executarSincronizacao } = require('../src/modules/opportunities/opportunities.job');

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

  it('marca a execução como falha quando o coletor lança erro', async () => {
    sincronizarJobs.mockRejectedValue(new Error('JobsPipe indisponível'));

    await expect(executarSincronizacao()).rejects.toThrow('JobsPipe indisponível');

    const chamadas = pool.query.mock.calls.map(([sql]) => sql);
    expect(chamadas.some((sql) => sql.includes("status, inicio_ultima_execucao"))).toBe(true);
    expect(chamadas.some((sql) => sql.includes('ultima_falha_mensagem'))).toBe(true);
  });
});
