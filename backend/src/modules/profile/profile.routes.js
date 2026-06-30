const { Router } = require('express');
const controller = require('./profile.controller');
const authGuard = require('../../middlewares/authGuard');

const router = Router();

router.use(authGuard);
router.post('/', controller.save);
router.get('/', controller.get);

module.exports = router;
