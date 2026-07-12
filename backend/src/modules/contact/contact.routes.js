const { Router } = require('express');
const controller = require('./contact.controller');
const { authLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

// Rota pública (sem authGuard) — formulário de contato do site institucional.
router.post('/', authLimiter, controller.enviar);

module.exports = router;
