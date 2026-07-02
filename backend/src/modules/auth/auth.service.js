const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../database/pool');
const env = require('../../config/env');
const { calcularIdade } = require('../../utils/date');
const verificationService = require('./verification.service');

const SALT_ROUNDS = 10;

async function register({ nome, email, senha, dataNascimento, estado, cidade }) {
  const hashed = await bcrypt.hash(senha, SALT_ROUNDS);
  const idade = calcularIdade(dataNascimento);

  const result = await pool.query(
    `INSERT INTO users (nome, email, senha, idade, cidade, data_nascimento, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nome, email, idade, cidade, data_nascimento, estado`,
    [nome, email, hashed, idade, cidade, dataNascimento, estado]
  );

  const usuario = result.rows[0];

  await verificationService.enviarCodigoVerificacaoEmail(usuario);

  return usuario;
}

async function login({ email, senha }) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    const err = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }

  const matches = await bcrypt.compare(senha, user.senha);
  if (!matches) {
    const err = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }

  if (!user.email_verificado) {
    const err = new Error('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
    err.status = 403;
    err.code = 'EMAIL_NAO_VERIFICADO';
    throw err;
  }

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
  };
}

async function buscarPorEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function verificarEmail({ email, codigo }) {
  const usuario = await buscarPorEmail(email);
  if (!usuario) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }

  await verificationService.validarCodigo(usuario.id, 'verificacao_email', codigo);

  await pool.query('UPDATE users SET email_verificado = true WHERE id = $1', [usuario.id]);

  return { message: 'E-mail confirmado com sucesso.' };
}

async function reenviarCodigoVerificacao({ email }) {
  const usuario = await buscarPorEmail(email);
  if (!usuario) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }

  if (usuario.email_verificado) {
    const err = new Error('Este e-mail já foi confirmado.');
    err.status = 400;
    throw err;
  }

  await verificationService.enviarCodigoVerificacaoEmail(usuario);

  return { message: 'Novo código enviado.' };
}

async function esqueciSenha({ email }) {
  const usuario = await buscarPorEmail(email);

  // Não revela se o e-mail existe ou não, por segurança.
  if (usuario) {
    await verificationService.enviarCodigoRedefinicaoSenha(usuario);
  }

  return { message: 'Se o e-mail existir em nossa base, um código foi enviado.' };
}

async function redefinirSenha({ email, codigo, novaSenha }) {
  const usuario = await buscarPorEmail(email);
  if (!usuario) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }

  await verificationService.validarCodigo(usuario.id, 'redefinicao_senha', codigo);

  const hashed = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  await pool.query('UPDATE users SET senha = $1 WHERE id = $2', [hashed, usuario.id]);

  return { message: 'Senha redefinida com sucesso.' };
}

module.exports = {
  register,
  login,
  verificarEmail,
  reenviarCodigoVerificacao,
  esqueciSenha,
  redefinirSenha,
};
