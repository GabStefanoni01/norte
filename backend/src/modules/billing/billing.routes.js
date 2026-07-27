const { Router } = require('express');
const controller = require('./billing.controller');
const authGuard = require('../../middlewares/authGuard');
const { authLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

// Webhook é público — o Mercado Pago não manda token de usuário.
router.post('/webhook', controller.webhook);

router.use(authGuard);
router.post('/assinar', authLimiter, controller.assinar);
router.post('/cancelar', authLimiter, controller.cancelar);
router.get('/status', controller.status);

module.exports = router;
