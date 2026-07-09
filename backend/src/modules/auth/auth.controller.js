const authService = require('./auth.service');

async function register(req, res, next) {
  try {
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
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verificarEmail(req, res, next) {
  try {
    const result = await authService.verificarEmail(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function reenviarCodigoVerificacao(req, res, next) {
  try {
    const result = await authService.reenviarCodigoVerificacao(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function esqueciSenha(req, res, next) {
  try {
    const result = await authService.esqueciSenha(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function redefinirSenha(req, res, next) {
  try {
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
