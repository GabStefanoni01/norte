const { Router } = require('express');
const controller = require('./discovery.controller');
const authGuard = require('../../middlewares/authGuard');
const { aiLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

router.use(authGuard);
router.get('/perguntas', controller.listarPerguntas);
router.post('/respostas', aiLimiter, controller.enviarRespostas);
router.get('/resultado', controller.buscarResultado);

module.exports = router;
