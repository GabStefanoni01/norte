const { Router } = require('express');
const controller = require('./resume.controller');
const authGuard = require('../../middlewares/authGuard');
const { aiLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

router.use(authGuard);
router.post('/gerar', aiLimiter, controller.gerar);
router.get('/me', controller.buscarAtual);
router.get('/entrevista/perguntas', controller.listarPerguntas);
router.post('/entrevista/feedback', aiLimiter, controller.enviarRespostas);
router.get('/entrevista/ultima', controller.buscarUltimaEntrevista);

module.exports = router;
