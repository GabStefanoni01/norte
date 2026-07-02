const { Router } = require('express');
const controller = require('./admin.controller');
const authGuard = require('../../middlewares/authGuard');
const adminGuard = require('../../middlewares/adminGuard');

const router = Router();

router.use(authGuard, adminGuard);
router.get('/users', controller.listarUsuarios);
router.patch('/users/:id/role', controller.atualizarRole);

module.exports = router;
