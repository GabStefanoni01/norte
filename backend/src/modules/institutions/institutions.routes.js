const { Router } = require('express');
const authGuard = require('../../middlewares/authGuard');
const controller = require('./institutions.controller');
const matchController = require('../institution-match/institution-match.controller');

const router = Router();

router.use(authGuard);

// Instituições não são criadas por usuários comuns.
// A criação ocorre após aprovação do Super Admin de uma solicitação institucional.
router.post('/:id/convites', controller.criarConvite);
router.post('/convites/aceitar', controller.aceitarConvite);
router.get('/minhas', controller.listar);
router.get('/:id/dashboard', controller.dashboard);
router.get('/:id/trilhas', controller.listarTrilhas);
router.post('/:id/trilhas', controller.criarTrilha);
router.patch('/:id/trilhas/:trailId/criterios', matchController.atualizarCriterios);
router.get('/:id/trilhas/matches', matchController.matchesParaUsuario);
router.get('/:id/trilhas/:trailId/matches', matchController.matchesDaTrilha);
router.get('/:id/trilhas/:trailId/participantes', controller.listarTrilhaMembros);
router.post('/:id/trilhas/:trailId/participantes', controller.atribuirParticipanteTrilha);
router.get('/:id/minhas-jornadas', controller.minhasJornadas);
router.patch('/:id/trilhas/:trailId/progresso', controller.atualizarProgressoTrilha);
router.get('/:id/participantes', controller.listarParticipantes);
router.patch('/:id/participantes/:memberId', controller.atualizarMembro);

module.exports = router;
