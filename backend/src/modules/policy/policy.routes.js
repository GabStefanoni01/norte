const { Router } = require('express');
const controller = require('./policy.controller');
const authGuard = require('../../middlewares/authGuard');
const { codeLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

router.post('/responder', codeLimiter, controller.responder);
router.get('/meu-status', authGuard, controller.meuStatus);

module.exports = router;
