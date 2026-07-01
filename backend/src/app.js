const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const plansRoutes = require('./modules/plans/plans.routes');
const opportunitiesRoutes = require('./modules/opportunities/opportunities.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/profile', profileRoutes);
app.use('/ai', aiRoutes);
app.use('/plans', plansRoutes);
app.use('/opportunities', opportunitiesRoutes);

app.use(errorHandler);

module.exports = app;
