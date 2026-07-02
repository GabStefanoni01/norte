const bcrypt = require('bcrypt');

function gerarCodigo() {
  // Código numérico de 6 dígitos, fácil de digitar.
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashCodigo(codigo) {
  return bcrypt.hash(codigo, 10);
}

async function codigoConfere(codigo, hash) {
  return bcrypt.compare(codigo, hash);
}

module.exports = { gerarCodigo, hashCodigo, codigoConfere };
