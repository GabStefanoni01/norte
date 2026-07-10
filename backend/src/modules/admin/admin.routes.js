const { Router } = require('express');
const controller = require('./admin.controller');
const authGuard = require('../../middlewares/authGuard');
const adminGuard = require('../../middlewares/adminGuard');
const { aiLimiter } = require('../../middlewares/rateLimiters');
const { executarRotinaDeLembretes } = require('../plans/plans.reminders');

const router = Router();

router.use(authGuard, adminGuard);
router.get('/users', controller.listarUsuarios);
router.patch('/users/:id/role', controller.atualizarRole);

router.post('/lembretes/enviar', aiLimiter, async (req, res, next) => {
  try {
    const resultado = await executarRotinaDeLembretes();
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
