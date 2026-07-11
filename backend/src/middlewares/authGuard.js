const jwt = require('jsonwebtoken');
const env = require('../config/env');
const pool = require('../database/pool');

async function authGuard(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = header.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  try {
    // Reconfirma a role no banco a cada requisição, em vez de confiar
    // cegamente no valor que veio dentro do token. Sem isso, revogar o
    // admin de alguém (ou apagar a conta) não teria efeito nenhum até o
    // token expirar naturalmente — podendo levar até 7 dias.
    const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [payload.sub]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = { ...payload, role: usuario.role };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authGuard;
