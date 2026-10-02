const metrics = require('../src/utils/metrics');

describe('request metrics', () => {
  beforeEach(() => metrics.reset());

  it('agrega volume, erros, status e duração média', () => {
    metrics.registrarRequest({ statusCode: 200, durationMs: 100, slow: false });
    metrics.registrarRequest({ statusCode: 404, durationMs: 300, slow: false });
    metrics.registrarRequest({ statusCode: 500, durationMs: 1100, slow: true });

    expect(metrics.snapshot()).toEqual({
      totalRequests: 3,
      totalErrors: 2,
      totalServerErrors: 1,
      totalClientErrors: 1,
      slowRequests: 1,
      averageDurationMs: 500,
      statusCodes: {
        '200': 1,
        '404': 1,
        '500': 1,
      },
    });
  });

  it('retorna métricas zeradas após reset', () => {
    metrics.registrarRequest({ statusCode: 201, durationMs: 25, slow: false });
    metrics.reset();

    expect(metrics.snapshot()).toEqual({
      totalRequests: 0,
      totalErrors: 0,
      totalServerErrors: 0,
      totalClientErrors: 0,
      slowRequests: 0,
      averageDurationMs: 0,
      statusCodes: {},
    });
  });
});
