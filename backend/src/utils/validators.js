const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO_REGEX = /^\d{6}$/;

function emailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email) && email.length <= 150;
}

function senhaValida(senha) {
  return typeof senha === 'string' && senha.length >= 6 && senha.length <= 100;
}

function codigoValido(codigo) {
  return typeof codigo === 'string' && CODIGO_REGEX.test(codigo);
}

function nomeValido(nome) {
  return typeof nome === 'string' && nome.trim().length >= 2 && nome.length <= 150;
}

/**
 * Lança um erro 400 com a primeira mensagem de validação que falhar.
 * Uso: validarOuFalhar([[emailValido(email), 'E-mail inválido'], ...])
 */
function validarOuFalhar(checagens) {
  for (const [ok, mensagem] of checagens) {
    if (!ok) {
      const err = new Error(mensagem);
      err.status = 400;
      throw err;
    }
  }
}

module.exports = { emailValido, senhaValida, codigoValido, nomeValido, validarOuFalhar };
