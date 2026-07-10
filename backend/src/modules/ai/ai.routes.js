const { Router } = require('express');
const controller = require('./ai.controller');
const authGuard = require('../../middlewares/authGuard');
const { aiLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

router.use(authGuard);
router.post('/chat', aiLimiter, controller.chat);
router.get('/chat/history', controller.history);

module.exports = router;
