const { Router } = require('express');
const controller = require('./ai.controller');
const authGuard = require('../../middlewares/authGuard');

const router = Router();

router.use(authGuard);
router.post('/chat', controller.chat);
router.get('/chat/history', controller.history);

module.exports = router;
