const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const pool = require('./database/pool');
const logger = require('./utils/logger');
const requestContext = require('./middlewares/requestContext');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const discoveryRoutes = require('./modules/discovery/discovery.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const plansRoutes = require('./modules/plans/plans.routes');
const resumeRoutes = require('./modules/resume/resume.routes');
const careerRoutes = require('./modules/career/career.routes');
const communityRoutes = require('./modules/community/community.routes');
const achievementsRoutes = require('./modules/achievements/achievements.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const policyRoutes = require('./modules/policy/policy.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const opportunitiesRoutes = require('./modules/opportunities/opportunities.routes');
const institutionsRoutes = require('./modules/institutions/institutions.routes');
const institutionInterestRoutes = require('./modules/institution-interest/institution-interest.routes');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

// Sem FRONTEND_URL configurada, libera qualquer origem (bom para
// desenvolvimento local, onde a porta do frontend pode variar). Em
// produção, defina FRONTEND_URL no .env para restringir a origens
// específicas — evita que qualquer site faça requisições autenticadas
// para a API usando o token de alguém.
const origensPermitidas = env.frontendUrl ? env.frontendUrl.split(',').map((o) => o.trim()) : true;

app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: '100kb' }));
app.use(requestContext);

app.get('/health', (req, res) => res.json({ status: 'ok', uptimeSeconds: Math.floor(process.uptime()) }));

app.get('/ready', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        to_regclass('public.users') AS users,
        to_regclass('public.opportunities') AS opportunities,
        to_regclass('public.saved_opportunities') AS saved_opportunities,
        to_regclass('public.email_dispatch_log') AS email_dispatch_log,
        to_regclass('public.institutions') AS institutions,
        to_regclass('public.institution_memberships') AS institution_memberships,
        to_regclass('public.institution_invitations') AS institution_invitations,
        to_regclass('public.institution_trails') AS institution_trails,
        to_regclass('public.institution_interest_requests') AS institution_interest_requests
    `);

    const schema = result.rows[0];
    const missing = Object.entries(schema)
      .filter(([, table]) => !table)
      .map(([name]) => name);

    if (missing.length > 0) {
      logger.error('health.readiness_schema_incomplete', new Error('Required database tables are missing'), {
        requestId: req.requestId,
        missing,
      });
      return res.status(503).json({ status: 'unavailable', reason: 'database_schema_incomplete' });
    }

    return res.json({ status: 'ready' });
  } catch (err) {
    logger.error('health.readiness_failed', err, { requestId: req.requestId });
    return res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/profile', profileRoutes);
app.use('/discovery', discoveryRoutes);
app.use('/ai', aiRoutes);
app.use('/plans', plansRoutes);
app.use('/resume', resumeRoutes);
app.use('/career', careerRoutes);
app.use('/community', communityRoutes);
app.use('/achievements', achievementsRoutes);
app.use('/admin', adminRoutes);
app.use('/contact', contactRoutes);
app.use('/politica', policyRoutes);
app.use('/billing', billingRoutes);
app.use('/opportunities', opportunitiesRoutes);
app.use('/institutions', institutionsRoutes);
app.use('/institution-interest', institutionInterestRoutes);

app.use(errorHandler);

module.exports = app;
