const metricas = {
  totalRequests: 0,
  totalErrors: 0,
  totalServerErrors: 0,
  totalClientErrors: 0,
  totalDurationMs: 0,
  slowRequests: 0,
  statusCodes: {},
};

function registrarRequest({ statusCode, durationMs, slow }) {
  const status = Number(statusCode) || 500;

  metricas.totalRequests += 1;
  metricas.totalDurationMs += durationMs;

  if (status >= 500) metricas.totalServerErrors += 1;
  else if (status >= 400) metricas.totalClientErrors += 1;

  if (status >= 400) metricas.totalErrors += 1;
  if (slow) metricas.slowRequests += 1;

  const chave = String(status);
  metricas.statusCodes[chave] = (metricas.statusCodes[chave] || 0) + 1;
}

function snapshot() {
  const total = metricas.totalRequests;
  return {
    totalRequests: total,
    totalErrors: metricas.totalErrors,
    totalServerErrors: metricas.totalServerErrors,
    totalClientErrors: metricas.totalClientErrors,
    slowRequests: metricas.slowRequests,
    averageDurationMs: total > 0
      ? Number((metricas.totalDurationMs / total).toFixed(2))
      : 0,
    statusCodes: { ...metricas.statusCodes },
  };
}

function reset() {
  metricas.totalRequests = 0;
  metricas.totalErrors = 0;
  metricas.totalServerErrors = 0;
  metricas.totalClientErrors = 0;
  metricas.totalDurationMs = 0;
  metricas.slowRequests = 0;
  metricas.statusCodes = {};
}

module.exports = { registrarRequest, snapshot, reset };
