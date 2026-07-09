const { Router } = require('express');
const controller = require('./achievements.controller');
const authGuard = require('../../middlewares/authGuard');

const router = Router();

router.use(authGuard);
router.get('/me', controller.buscarMinhas);

module.exports = router;
