const { Router } = require('express');
const authGuard = require('../../middlewares/authGuard');
const controller = require('./institutions.controller');

const router = Router();

router.use(authGuard);

router.post('/', controller.criar);
router.post('/:id/convites', controller.criarConvite);
router.post('/convites/aceitar', controller.aceitarConvite);
router.get('/minhas', controller.listar);
router.get('/:id/dashboard', controller.dashboard);
router.get('/:id/trilhas', controller.listarTrilhas);
router.post('/:id/trilhas', controller.criarTrilha);
router.get('/:id/participantes', controller.listarParticipantes);
router.patch('/:id/participantes/:memberId', controller.atualizarMembro);

module.exports = router;
