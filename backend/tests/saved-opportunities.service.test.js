jest.mock('../src/database/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../src/database/pool');
const service = require('../src/modules/opportunities/saved-opportunities.service');

describe('saved-opportunities.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('salva uma oportunidade publicada e retorna o registro criado', async () => {
    const salvo = { id: 10, opportunity_id: 377, created_at: '2026-10-02T20:00:00.000Z' };
    pool.query.mockResolvedValueOnce({ rows: [salvo] });

    await expect(service.salvar(7, 377)).resolves.toEqual(salvo);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][1]).toEqual([7, 377]);
  });

  it('retorna o registro existente quando o save é repetido', async () => {
    const existente = { id: 10, opportunity_id: 377, created_at: '2026-10-02T20:00:00.000Z' };
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [existente] });

    await expect(service.salvar(7, 377)).resolves.toEqual(existente);

    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('lança 404 quando a oportunidade não existe ou está indisponível', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(service.salvar(7, 999)).rejects.toMatchObject({
      message: 'Oportunidade não encontrada ou indisponível',
      status: 404,
    });
  });

  it('remove uma oportunidade salva e informa se houve remoção', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });

    await expect(service.remover(7, 377)).resolves.toBe(true);
    expect(pool.query.mock.calls[0][1]).toEqual([7, 377]);
  });

  it('informa false quando não havia oportunidade salva para remover', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    await expect(service.remover(7, 377)).resolves.toBe(false);
  });

  it('verifica corretamente se uma oportunidade está salva', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ salvo: true }] });

    await expect(service.verificar(7, 377)).resolves.toBe(true);
  });
});
