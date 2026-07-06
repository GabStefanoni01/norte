const { Router } = require('express');
const controller = require('./opportunities.controller');
const authGuard = require('../../middlewares/authGuard');
const adminGuard = require('../../middlewares/adminGuard');

const router = Router();

router.use(authGuard);
router.get('/', controller.listar);
router.get('/todas', adminGuard, controller.listarTodas);
router.post('/', adminGuard, controller.criar);
router.post('/buscar-na-web', adminGuard, controller.buscarNaWeb);
router.patch('/:id/status', adminGuard, controller.atualizarStatus);
router.delete('/:id', adminGuard, controller.remover);

module.exports = router;
