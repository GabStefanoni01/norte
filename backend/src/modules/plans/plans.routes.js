const { Router } = require('express');
const controller = require('./plans.controller');
const authGuard = require('../../middlewares/authGuard');
const { aiLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

router.use(authGuard);
router.post('/gerar', aiLimiter, controller.gerar);
router.get('/me', controller.buscarAtual);
router.patch('/:planId/itens/:itemId', controller.atualizarItem);

module.exports = router;
