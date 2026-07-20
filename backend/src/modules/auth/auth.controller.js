const authService = require('./auth.service');
const { emailValido, senhaValida, codigoValido, nomeValido, validarOuFalhar } = require('../../utils/validators');

async function register(req, res, next) {
  try {
    const { nome, email, senha } = req.body;

    validarOuFalhar([
      [nomeValido(nome), 'Nome inválido (mínimo 2 caracteres).'],
      [emailValido(email), 'E-mail inválido.'],
      [senhaValida(senha), 'Senha deve ter entre 6 e 100 caracteres.'],
    ]);

    const user = await authService.register(req.body);
    res.status(201).json({
      message: 'Cadastro criado. Verifique seu e-mail para confirmar a conta.',
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    validarOuFalhar([
      [emailValido(email), 'E-mail inválido.'],
      [typeof senha === 'string' && senha.length > 0, 'Senha é obrigatória.'],
    ]);

    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const result = await authService.login(req.body, meta);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verificarEmail(req, res, next) {
  try {
    const { email, codigo } = req.body;

    validarOuFalhar([
      [emailValido(email), 'E-mail inválido.'],
      [codigoValido(codigo), 'Código deve ter 6 dígitos.'],
    ]);

    const result = await authService.verificarEmail(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function reenviarCodigoVerificacao(req, res, next) {
  try {
    validarOuFalhar([[emailValido(req.body.email), 'E-mail inválido.']]);

    const result = await authService.reenviarCodigoVerificacao(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function esqueciSenha(req, res, next) {
  try {
    validarOuFalhar([[emailValido(req.body.email), 'E-mail inválido.']]);

    const result = await authService.esqueciSenha(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function redefinirSenha(req, res, next) {
  try {
    const { email, codigo, novaSenha } = req.body;

    validarOuFalhar([
      [emailValido(email), 'E-mail inválido.'],
      [codigoValido(codigo), 'Código deve ter 6 dígitos.'],
      [senhaValida(novaSenha), 'Nova senha deve ter entre 6 e 100 caracteres.'],
    ]);

    const result = await authService.redefinirSenha(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  verificarEmail,
  reenviarCodigoVerificacao,
  esqueciSenha,
  redefinirSenha,
};
