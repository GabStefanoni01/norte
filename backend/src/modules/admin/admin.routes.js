const { Router } = require('express');
const controller = require('./admin.controller');
const authGuard = require('../../middlewares/authGuard');
const adminGuard = require('../../middlewares/adminGuard');
const { aiLimiter } = require('../../middlewares/rateLimiters');
const { executarRotinaDeLembretes } = require('../plans/plans.reminders');
const { enviarSolicitacoesRetroativas, enviarSolicitacaoParaUsuario } = require('../policy/policy.service');
const pool = require('../../database/pool');
const metrics = require('../../utils/metrics');
const { dispararSincronizacao } = require('../opportunities/opportunities.job');

const router = Router();

router.use(authGuard, adminGuard);
router.get('/users', controller.listarUsuarios);
router.patch('/users/:id/role', controller.atualizarRole);
router.patch('/users/:id/plano', controller.atualizarPlano);

router.get('/observabilidade', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT status, inicio_ultima_execucao, fim_ultima_execucao,
             ultima_execucao_sucesso, ultima_falha_em, ultima_falha_mensagem
      FROM opportunity_collector_state
      WHERE chave = $1
    `, ['jobspipe']);

    res.json({
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      requests: metrics.snapshot(),
      collector: result.rows[0] || { status: 'idle' },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/oportunidades/sincronizar', aiLimiter, async (req, res, next) => {
  try {
    const resultado = await dispararSincronizacao();
    return res.status(resultado.status === 'already_running' ? 409 : 202).json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post('/lembretes/enviar', aiLimiter, async (req, res, next) => {
  try {
    const resultado = await executarRotinaDeLembretes();
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post('/politica/enviar-solicitacoes', aiLimiter, async (req, res, next) => {
  try {
    const resultado = await enviarSolicitacoesRetroativas();
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post('/politica/reenviar/:userId', aiLimiter, async (req, res, next) => {
  try {
    const resultado = await enviarSolicitacaoParaUsuario(req.params.userId);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

module.exports = router;