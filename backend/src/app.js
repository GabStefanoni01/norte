const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const discoveryRoutes = require('./modules/discovery/discovery.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const plansRoutes = require('./modules/plans/plans.routes');
const resumeRoutes = require('./modules/resume/resume.routes');
const careerRoutes = require('./modules/career/career.routes');
const achievementsRoutes = require('./modules/achievements/achievements.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const policyRoutes = require('./modules/policy/policy.routes');

const app = express();

app.use(helmet());

// Sem FRONTEND_URL configurada, libera qualquer origem (bom para
// desenvolvimento local, onde a porta do frontend pode variar). Em
// produção, defina FRONTEND_URL no .env para restringir a origens
// específicas — evita que qualquer site faça requisições autenticadas
// para a API usando o token de alguém.
const origensPermitidas = env.frontendUrl ? env.frontendUrl.split(',').map((o) => o.trim()) : true;

app.use(cors({ origin: origensPermitidas }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/profile', profileRoutes);
app.use('/discovery', discoveryRoutes);
app.use('/ai', aiRoutes);
app.use('/plans', plansRoutes);
app.use('/resume', resumeRoutes);
app.use('/career', careerRoutes);
app.use('/achievements', achievementsRoutes);
app.use('/admin', adminRoutes);
app.use('/contact', contactRoutes);
app.use('/politica', policyRoutes);

app.use(errorHandler);

module.exports = app;
