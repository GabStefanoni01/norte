const { fetchResiliente, deveTentarNovamente } = require('../src/utils/resilient-fetch');

describe('resilient fetch', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('considera 429 e 5xx recuperáveis', () => {
    expect(deveTentarNovamente(408)).toBe(true);
    expect(deveTentarNovamente(429)).toBe(true);
    expect(deveTentarNovamente(500)).toBe(true);
    expect(deveTentarNovamente(404)).toBe(false);
  });

  it('faz retry com backoff quando recebe 429', async () => {
    const respostas = [
      { ok: false, status: 429 },
      { ok: false, status: 503 },
      { ok: true, status: 200 },
    ];

    global.fetch = jest.fn()
      .mockResolvedValueOnce(respostas[0])
      .mockResolvedValueOnce(respostas[1])
      .mockResolvedValueOnce(respostas[2]);

    await expect(fetchResiliente('https://example.com', {}, {
      maxRetries: 2,
      baseDelayMs: 1,
      timeoutMs: 100,
    })).resolves.toEqual(respostas[2]);

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('retorna erro de timeout após esgotar as tentativas', async () => {
    global.fetch = jest.fn(() => new Promise(() => {}));

    await expect(fetchResiliente('https://example.com', {}, {
      maxRetries: 0,
      timeoutMs: 5,
    })).rejects.toMatchObject({ code: 'EXTERNAL_TIMEOUT' });
  });
});
