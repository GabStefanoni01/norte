function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  if (status >= 500) {
    console.error(err);
  }

  const body = { error: message };
  if (err.code) {
    body.code = err.code;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
