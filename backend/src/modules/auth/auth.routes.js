const { Router } = require('express');
const controller = require('./auth.controller');
const { authLimiter, codeLimiter } = require('../../middlewares/rateLimiters');

const router = Router();

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/verificar-email', codeLimiter, controller.verificarEmail);
router.post('/reenviar-codigo', codeLimiter, controller.reenviarCodigoVerificacao);
router.post('/esqueci-senha', codeLimiter, controller.esqueciSenha);
router.post('/redefinir-senha', codeLimiter, controller.redefinirSenha);

module.exports = router;
