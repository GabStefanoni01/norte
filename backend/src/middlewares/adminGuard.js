/**
 * Deve ser usado sempre depois de authGuard (que popula req.user a partir
 * do JWT). Bloqueia o acesso a quem não tem role 'admin'.
 */
function adminGuard(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = adminGuard;
