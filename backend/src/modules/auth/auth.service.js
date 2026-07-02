const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../database/pool');
const env = require('../../config/env');
const { calcularIdade } = require('../../utils/date');

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

  return result.rows[0];
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

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
  };
}

module.exports = { register, login };
