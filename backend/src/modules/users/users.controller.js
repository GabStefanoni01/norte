const usersService = require('./users.service');
const { nomeValido } = require('../../utils/validators');

function ensureSelfOrAdmin(req, res) {
  const requestedId = Number(req.params.id);
  if (req.user.sub !== requestedId) {
    res.status(403).json({ error: 'Você não tem permissão para acessar este recurso' });
    return false;
  }
  return true;
}

async function getById(req, res, next) {
  try {
    if (!ensureSelfOrAdmin(req, res)) return;

    const user = await usersService.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!ensureSelfOrAdmin(req, res)) return;

    if (req.body.nome !== undefined && !nomeValido(req.body.nome)) {
      return res.status(400).json({ error: 'Nome inválido (mínimo 2 caracteres).' });
    }

    const user = await usersService.update(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (!ensureSelfOrAdmin(req, res)) return;

    const result = await usersService.softDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getById, update, remove };
