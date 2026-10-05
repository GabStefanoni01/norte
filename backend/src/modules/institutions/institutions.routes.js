const { Router } = require('express');
const authGuard = require('../../middlewares/authGuard');
const controller = require('./institutions.controller');

const router = Router();

router.use(authGuard);

router.post('/', controller.criar);
router.get('/minhas', controller.listar);
router.get('/:id/participantes', controller.listarParticipantes);
router.patch('/:id/participantes/:memberId', controller.atualizarMembro);

module.exports = router;
