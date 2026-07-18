const { Router } = require('express');
const controller = require('./career.controller');
const authGuard = require('../../middlewares/authGuard');

const router = Router();

router.use(authGuard);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);

module.exports = router;
