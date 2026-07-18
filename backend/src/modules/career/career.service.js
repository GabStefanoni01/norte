const { CARREIRAS } = require('./career.data');

async function listarCarreiras() {
  return CARREIRAS;
}

async function buscarCarreiraPorId(id) {
  const carreira = CARREIRAS.find((item) => item.id === id);
  if (!carreira) {
    const err = new Error('Carreira não encontrada.');
    err.status = 404;
    throw err;
  }
  return carreira;
}

module.exports = { listarCarreiras, buscarCarreiraPorId };
