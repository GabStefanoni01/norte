const { Router } = require('express');
const controller = require('./opportunities.controller');
const authGuard = require('../../middlewares/authGuard');
const adminGuard = require('../../middlewares/adminGuard');

const router = Router();
router.use(authGuard);
router.get('/', controller.listar);
router.post('/', adminGuard, controller.criar);
router.delete('/:id', adminGuard, controller.remover);
router.post('/:id/fechar-lacuna', controller.fecharLacuna);

module.exports = router;
