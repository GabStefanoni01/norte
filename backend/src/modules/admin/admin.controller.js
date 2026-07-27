const adminService = require('./admin.service');

async function listarUsuarios(req, res, next) {
  try {
    const usuarios = await adminService.listarUsuarios();
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

async function atualizarRole(req, res, next) {
  try {
    const usuario = await adminService.atualizarRole(req.params.id, req.body.role);
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

async function atualizarPlano(req, res, next) {
  try {
    const usuario = await adminService.atualizarPlano(req.params.id, req.body.plano);
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

module.exports = { listarUsuarios, atualizarRole, atualizarPlano };
