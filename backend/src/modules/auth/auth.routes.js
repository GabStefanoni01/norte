const { Router } = require('express');
const controller = require('./auth.controller');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/verificar-email', controller.verificarEmail);
router.post('/reenviar-codigo', controller.reenviarCodigoVerificacao);
router.post('/esqueci-senha', controller.esqueciSenha);
router.post('/redefinir-senha', controller.redefinirSenha);

module.exports = router;
