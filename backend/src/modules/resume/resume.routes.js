const { Router } = require('express');
const controller = require('./resume.controller');
const authGuard = require('../../middlewares/authGuard');

const router = Router();

router.use(authGuard);
router.post('/gerar', controller.gerar);
router.get('/me', controller.buscarAtual);
router.get('/entrevista/perguntas', controller.listarPerguntas);
router.post('/entrevista/feedback', controller.enviarRespostas);
router.get('/entrevista/ultima', controller.buscarUltimaEntrevista);

module.exports = router;
