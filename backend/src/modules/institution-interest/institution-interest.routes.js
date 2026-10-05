const { Router } = require('express');
const controller = require('./institution-interest.controller');
const { authLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

router.post('/', authLimiter, controller.criar);

module.exports = router;
