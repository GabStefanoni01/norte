const crypto = require('crypto');
const bcrypt = require('bcrypt');

function gerarCodigo() {
  // Código numérico de 6 dígitos, fácil de digitar. crypto.randomInt é
  // criptograficamente seguro — Math.random() não é e não deveria ser
  // usado pra gerar códigos de segurança (verificação de e-mail, senha).
  return String(crypto.randomInt(100000, 1000000));
}

async function hashCodigo(codigo) {
  return bcrypt.hash(codigo, 10);
}

async function codigoConfere(codigo, hash) {
  return bcrypt.compare(codigo, hash);
}

module.exports = { gerarCodigo, hashCodigo, codigoConfere };
