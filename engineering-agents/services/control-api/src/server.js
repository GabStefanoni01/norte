'use strict';

const express = require('express');
const helmet = require('helmet');
const { Pool } = require('pg');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '32kb', strict: true }));

const port = Number(process.env.PORT || 4310);
const apiToken = process.env.AGENTS_API_TOKEN;
const ingestToken = process.env.AGENTS_INGEST_TOKEN;
const databaseUrl = process.env.DATABASE_URL;
const allowedOrigin = process.env.DASHBOARD_ORIGIN;

if (!apiToken || apiToken.length < 32) {
  throw new Error('AGENTS_API_TOKEN must be configured with at least 32 characters');
}
if (!ingestToken || ingestToken.length < 32) {
  throw new Error('AGENTS_INGEST_TOKEN must be configured with at least 32 characters');
}
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured');
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined,
});

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && allowedOrigin && origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin && origin === allowedOrigin ? 204 : 403);
  next();
});

function tokenMatches(req, expectedToken) {
  const header = req.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = Buffer.from(expectedToken);
  const actual = Buffer.from(supplied);
  const { timingSafeEqual } = require('node:crypto');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function requireToken(req, res, next) {
  if (!tokenMatches(req, apiToken)) return res.status(401).json({ error: 'unauthorized' });
  next();
}

function requireIngestToken(req, res, next) {
  if (!tokenMatches(req, ingestToken)) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'control-api' }));

app.post('/internal/tasks', requireIngestToken, async (req, res, next) => {
  try {
    const body = req.body || {};
    const categories = new Set(['security', 'reliability', 'performance', 'testing', 'architecture', 'maintainability', 'documentation', 'accessibility', 'other']);
    const findingTypes = new Set(['potential_defect', 'code_smell', 'maintenance_signal']);
    const findingType = body.findingType == null ? 'maintenance_signal' : body.findingType;
    const recommendedAction = body.recommendedAction == null ? null : body.recommendedAction;
    const priorityRationale = body.priorityRationale == null ? null : body.priorityRationale;
    const analysisPlan = body.analysisPlan == null ? null : body.analysisPlan;
    const validId = typeof body.id === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(body.id);
    const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (!validId || !validText(body.title, 200) || !validText(body.summary, 4000) || !categories.has(body.category) || !findingTypes.has(findingType)) {
      return res.status(400).json({ error: 'invalid_task_payload' });
    }
    if ((recommendedAction !== null && !validText(recommendedAction, 2000)) ||
        (priorityRationale !== null && !validText(priorityRationale, 2000))) {
      return res.status(400).json({ error: 'invalid_recommendation_fields' });
    }
    const validPlanText = (value, max) => validText(value, max);
    const validAnalysisPlan = analysisPlan === null || (
      analysisPlan && typeof analysisPlan === 'object' && !Array.isArray(analysisPlan) &&
      validPlanText(analysisPlan.hypothesis, 1000) &&
      Array.isArray(analysisPlan.steps) && analysisPlan.steps.length >= 1 && analysisPlan.steps.length <= 5 &&
      analysisPlan.steps.every((item) => validPlanText(item, 500)) &&
      Array.isArray(analysisPlan.validation) && analysisPlan.validation.length >= 1 && analysisPlan.validation.length <= 5 &&
      analysisPlan.validation.every((item) => validPlanText(item, 500)) &&
      validPlanText(analysisPlan.rollback, 1000) && analysisPlan.humanApprovalRequired === true
    );
    if (!validAnalysisPlan) return res.status(400).json({ error: 'invalid_analysis_plan' });
    if (body.evidence !== undefined && (!Array.isArray(body.evidence) || body.evidence.length > 50)) {
      return res.status(400).json({ error: 'invalid_evidence' });
    }
    const repositoryName = body.repositoryName == null ? null : body.repositoryName;
    const repositoryUrl = body.repositoryUrl == null ? null : body.repositoryUrl;
    const repositoryRef = body.repositoryRef == null ? null : body.repositoryRef;
    if (repositoryName !== null && !validText(repositoryName, 120)) {
      return res.status(400).json({ error: 'invalid_repository_name' });
    }
    if (repositoryUrl !== null) {
      if (!validText(repositoryUrl, 1000)) return res.status(400).json({ error: 'invalid_repository_url' });
      try {
        const parsed = new URL(repositoryUrl);
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
          return res.status(400).json({ error: 'invalid_repository_url' });
        }
      } catch {
        return res.status(400).json({ error: 'invalid_repository_url' });
      }
    }
    if (repositoryRef !== null && (!validText(repositoryRef, 255) || repositoryRef.includes(String.fromCharCode(13)) || repositoryRef.includes(String.fromCharCode(10)))) {
      return res.status(400).json({ error: 'invalid_repository_ref' });
    }
    const priority = Number(body.priority ?? 0);
    const impact = body.impact == null ? null : Number(body.impact);
    const confidence = body.confidence == null ? null : Number(body.confidence);
    const effort = body.effort == null ? null : Number(body.effort);
    const risk = body.risk == null ? null : Number(body.risk);
    if (!Number.isFinite(priority) || priority < 0 || priority > 100 ||
        (impact !== null && (!Number.isInteger(impact) || impact < 1 || impact > 5)) ||
        (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) ||
        (effort !== null && (!Number.isInteger(effort) || effort < 1 || effort > 5)) ||
        (risk !== null && (!Number.isInteger(risk) || risk < 1 || risk > 5))) {
      return res.status(400).json({ error: 'invalid_scoring_fields' });
    }
    const evidence = body.evidence || [];
    if (!evidence.every(item => item && typeof item === 'object' && !Array.isArray(item) &&
        validText(item.description, 2000) &&
        (item.path === undefined || (typeof item.path === 'string' && item.path.length <= 500)) &&
        (item.startLine === undefined || (Number.isInteger(item.startLine) && item.startLine > 0)) &&
        (item.endLine === undefined || (Number.isInteger(item.endLine) && item.endLine > 0)) &&
        (item.url === undefined || (typeof item.url === 'string' && /^https?:\/\//.test(item.url))))) {
      return res.status(400).json({ error: 'invalid_evidence' });
    }
    const result = await pool.query(
      `INSERT INTO engineering_improvements
        (id, title, summary, category, status, priority, impact, confidence, effort, risk, evidence,
         repository_name, repository_url, repository_ref, finding_type, recommended_action, priority_rationale, analysis_plan)
       VALUES ($1, $2, $3, $4, 'discovered', $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         repository_name = COALESCE(engineering_improvements.repository_name, EXCLUDED.repository_name),
         repository_url = COALESCE(engineering_improvements.repository_url, EXCLUDED.repository_url),
         repository_ref = COALESCE(engineering_improvements.repository_ref, EXCLUDED.repository_ref),
         finding_type = COALESCE(engineering_improvements.finding_type, EXCLUDED.finding_type),
         priority = EXCLUDED.priority,
         impact = EXCLUDED.impact,
         confidence = EXCLUDED.confidence,
         effort = EXCLUDED.effort,
         risk = EXCLUDED.risk,
         recommended_action = EXCLUDED.recommended_action,
         priority_rationale = EXCLUDED.priority_rationale,
         analysis_plan = EXCLUDED.analysis_plan
       WHERE engineering_improvements.execution_approved_at IS NULL
         AND ((engineering_improvements.repository_name IS NULL AND EXCLUDED.repository_name IS NOT NULL)
          OR (engineering_improvements.repository_url IS NULL AND EXCLUDED.repository_url IS NOT NULL)
          OR (engineering_improvements.repository_ref IS NULL AND EXCLUDED.repository_ref IS NOT NULL)
          OR (engineering_improvements.finding_type IS NULL AND EXCLUDED.finding_type IS NOT NULL)
          OR engineering_improvements.priority IS DISTINCT FROM EXCLUDED.priority
          OR engineering_improvements.impact IS DISTINCT FROM EXCLUDED.impact
          OR engineering_improvements.confidence IS DISTINCT FROM EXCLUDED.confidence
          OR engineering_improvements.effort IS DISTINCT FROM EXCLUDED.effort
          OR engineering_improvements.risk IS DISTINCT FROM EXCLUDED.risk
          OR engineering_improvements.recommended_action IS DISTINCT FROM EXCLUDED.recommended_action
          OR engineering_improvements.priority_rationale IS DISTINCT FROM EXCLUDED.priority_rationale
          OR engineering_improvements.analysis_plan IS DISTINCT FROM EXCLUDED.analysis_plan)
       RETURNING id, title, category, status, priority, created_at AS "createdAt", (xmax = 0) AS inserted`,
      [body.id, body.title.trim(), body.summary.trim(), body.category, priority, impact, confidence, effort, risk,
        JSON.stringify(evidence), repositoryName?.trim() || null, repositoryUrl, repositoryRef, findingType, recommendedAction, priorityRationale, analysisPlan ? JSON.stringify(analysisPlan) : null],
    );
    if (!result.rowCount) return res.status(409).json({ error: 'task_already_exists' });
    const statusCode = result.rows[0].inserted ? 201 : 200;
    return res.status(statusCode).json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});


app.post('/api/tasks/:id/triage', requireToken, async (req, res, next) => {
  const body = req.body || {};
  const decisions = new Set(['confirmed', 'false_positive', 'needs_context']);
  const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
  if (!decisions.has(body.decision) || !validText(body.reason, 2000) || body.reason.trim().length < 10) {
    return res.status(400).json({ error: 'invalid_triage_payload', message: 'Informe uma decisão válida e uma justificativa de 10 a 2000 caracteres.' });
  }
  const reviewer = body.reviewer == null ? '' : body.reviewer;
  if (!validText(reviewer, 120)) {
    return res.status(400).json({ error: 'invalid_reviewer' });
  }

  const nextStatus = body.decision === 'confirmed' ? 'triaged'
    : body.decision === 'false_positive' ? 'rejected' : 'discovered';
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE engineering_improvements
          SET triage_decision = $2,
              triage_reason = $3,
              triaged_by = $4,
              triaged_at = NOW(),
              status = $5
        WHERE id = $1
          AND status IN ('discovered', 'triaged', 'rejected')
        RETURNING id, title, status, triage_decision AS "triageDecision",
                  triage_reason AS "triageReason", triaged_by AS "triagedBy",
                  triaged_at AS "triagedAt"`,
      [req.params.id, body.decision, body.reason.trim(), reviewer.trim(), nextStatus],
    );
    if (!updated.rowCount) {
      await client.query('ROLLBACK');
      const exists = await pool.query('SELECT 1 FROM engineering_improvements WHERE id = $1', [req.params.id]);
      if (!exists.rowCount) return res.status(404).json({ error: 'task_not_found' });
      return res.status(409).json({ error: 'task_not_triageable', message: 'Somente tarefas em descoberta, triagem ou rejeitadas podem ser reavaliadas.' });
    }
    await client.query(
      `INSERT INTO engineering_improvement_triage_events (task_id, decision, reason, reviewer)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, body.decision, body.reason.trim(), reviewer.trim()],
    );
    await client.query('COMMIT');
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ task: updated.rows[0] });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* transaction may already be closed */ }
    return next(error);
  } finally {
    if (client) client.release();
  }
});

app.get('/api/tasks/:id/triage-history', requireToken, async (req, res, next) => {
  try {
    const exists = await pool.query('SELECT 1 FROM engineering_improvements WHERE id = $1', [req.params.id]);
    if (!exists.rowCount) return res.status(404).json({ error: 'task_not_found' });
    const result = await pool.query(
      `SELECT decision, reason, reviewer, created_at AS "createdAt"
         FROM engineering_improvement_triage_events
        WHERE task_id = $1
        ORDER BY created_at DESC
        LIMIT 50`,
      [req.params.id],
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ events: result.rows });
  } catch (error) {
    return next(error);
  }
});


const allowedTransitions = {
  discovered: ['triaged', 'rejected'],
  triaged: ['analyzing', 'queued', 'blocked', 'rejected'],
  queued: ['analyzing', 'blocked', 'cancelled'],
  analyzing: ['planned', 'blocked', 'failed'],
  planned: ['awaiting_approval', 'blocked', 'rejected'],
  awaiting_approval: ['rejected'],
  implementing: ['reviewing', 'blocked', 'failed'],
  reviewing: ['validating', 'implementing', 'rejected'],
  validating: ['completed', 'implementing', 'failed'],
  blocked: ['triaged', 'queued', 'cancelled'],
  failed: ['queued', 'cancelled'],
  rejected: ['discovered'],
  cancelled: [],
  completed: [],
};

app.post('/api/tasks/:id/transition', requireToken, async (req, res, next) => {
  const body = req.body || {};
  const valid = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
  if (!valid(body.toStatus, 40) || !valid(body.reason, 2000) || body.reason.trim().length < 10 || !valid(body.actor, 120)) {
    return res.status(400).json({ error: 'invalid_transition_payload' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const current = await client.query('SELECT id, status, analysis_plan FROM engineering_improvements WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!current.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'task_not_found' });
    }
    const from = current.rows[0].status;
    if (!allowedTransitions[from]?.includes(body.toStatus)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'invalid_status_transition', fromStatus: from, toStatus: body.toStatus });
    }
    if (body.toStatus === 'awaiting_approval' &&
        (!current.rows[0].analysis_plan || current.rows[0].analysis_plan.humanApprovalRequired !== true)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'approval_plan_required' });
    }
    const updated = await client.query('UPDATE engineering_improvements SET status = $2 WHERE id = $1 RETURNING id, title, status', [req.params.id, body.toStatus]);
    await client.query(
      'INSERT INTO engineering_improvement_workflow_events (task_id, from_status, to_status, reason, actor) VALUES ($1, $2, $3, $4, $5)',
      [req.params.id, from, body.toStatus, body.reason.trim(), body.actor.trim()],
    );
    await client.query('COMMIT');
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ task: updated.rows[0] });
  } catch (error) {
    try { if (client) await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    if (client) client.release();
  }
});


app.post('/api/tasks/:id/approve-execution', requireToken, async (req, res, next) => {
  const body = req.body || {};
  const valid = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
  if (!valid(body.approvedBy, 120) || !valid(body.reason, 2000) || body.reason.trim().length < 10) {
    return res.status(400).json({ error: 'invalid_approval_payload' });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const found = await client.query(
      'SELECT id, title, status, analysis_plan FROM engineering_improvements WHERE id = $1 FOR UPDATE',
      [req.params.id],
    );
    if (!found.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'task_not_found' });
    }
    const task = found.rows[0];
    if (task.status !== 'awaiting_approval') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'task_not_awaiting_approval' });
    }
    const plan = task.analysis_plan;
    if (!plan || typeof plan !== 'object' || plan.humanApprovalRequired !== true) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'approval_plan_required' });
    }
    const planJson = JSON.stringify(plan);
    const planSha256 = require('node:crypto').createHash('sha256').update(planJson).digest('hex');
    await client.query(
      'INSERT INTO engineering_improvement_execution_approvals (task_id, approved_by, reason, plan_snapshot, plan_sha256) VALUES ($1, $2, $3, $4::jsonb, $5)',
      [task.id, body.approvedBy.trim(), body.reason.trim(), planJson, planSha256],
    );
    const updated = await client.query(
      "UPDATE engineering_improvements SET status = 'queued', execution_approved_at = NOW(), execution_approved_by = $2, execution_approval_reason = $3, approved_plan_sha256 = $4 WHERE id = $1 RETURNING id, title, status, execution_approved_at AS \"executionApprovedAt\", execution_approved_by AS \"executionApprovedBy\", approved_plan_sha256 AS \"approvedPlanSha256\"",
      [task.id, body.approvedBy.trim(), body.reason.trim(), planSha256],
    );
    await client.query(
      "INSERT INTO engineering_improvement_workflow_events (task_id, from_status, to_status, reason, actor) VALUES ($1, 'awaiting_approval', 'queued', $2, $3)",
      [task.id, body.reason.trim(), body.approvedBy.trim()],
    );
    await client.query('COMMIT');
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ task: updated.rows[0], message: 'Aprovação registrada. Nenhum código foi executado.' });
  } catch (error) {
    try { if (client) await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    if (client) client.release();
  }
});

app.post('/internal/execution-queue/claim', requireIngestToken, async (req, res, next) => {
  const body = req.body || {};
  const workerId = body.workerId;
  const requestedTaskId = body.taskId == null ? null : body.taskId;
  if (typeof workerId !== 'string' || !/^[A-Za-z0-9._:-]{1,120}$/.test(workerId)) {
    return res.status(400).json({ error: 'invalid_worker_id' });
  }
  if (requestedTaskId !== null && (typeof requestedTaskId !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(requestedTaskId))) {
    return res.status(400).json({ error: 'invalid_task_id' });
  }

  const leaseToken = require('node:crypto').randomBytes(32).toString('hex');
  const leaseSeconds = 300;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const claimed = await client.query(
      `WITH candidate AS (
         SELECT id
           FROM engineering_improvements
          WHERE status = 'queued'
            AND execution_approved_at IS NOT NULL
            AND approved_plan_sha256 IS NOT NULL
            AND ($4::text IS NULL OR id = $4)
            AND (worker_lease_expires_at IS NULL OR worker_lease_expires_at <= NOW())
          ORDER BY priority DESC, updated_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
       )
       UPDATE engineering_improvements AS task
          SET worker_lease_owner = $1,
              worker_lease_token = $2,
              worker_lease_expires_at = NOW() + ($3 * INTERVAL '1 second'),
              worker_attempts = worker_attempts + 1
         FROM candidate
        WHERE task.id = candidate.id
       RETURNING task.id, task.title, task.summary, task.category, task.priority,
                 task.repository_name AS "repositoryName", task.repository_url AS "repositoryUrl",
                 task.repository_ref AS "repositoryRef", task.analysis_plan AS "analysisPlan",
                 task.execution_approved_at AS "executionApprovedAt",
                 task.execution_approved_by AS "executionApprovedBy",
                 task.approved_plan_sha256 AS "approvedPlanSha256",
                 task.worker_lease_expires_at AS "leaseExpiresAt",
                 task.worker_attempts AS "workerAttempts"`,
      [workerId, leaseToken, leaseSeconds, requestedTaskId],
    );
    await client.query('COMMIT');
    res.setHeader('Cache-Control', 'no-store');
    if (!claimed.rowCount) {
      return res.json({ task: null, executionEnabled: false, message: 'No eligible unleased task found.' });
    }
    return res.json({
      task: claimed.rows[0],
      lease: { owner: workerId, token: leaseToken, expiresAt: claimed.rows[0].leaseExpiresAt },
      executionEnabled: false,
      message: 'Task claimed for coordination only. No code was executed.',
    });
  } catch (error) {
    try { if (client) await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    if (client) client.release();
  }
});

app.post('/internal/execution-queue/:id/release', requireIngestToken, async (req, res, next) => {
  const body = req.body || {};
  const validWorkerId = typeof body.workerId === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(body.workerId);
  const validLeaseToken = typeof body.leaseToken === 'string' && /^[a-f0-9]{64}$/.test(body.leaseToken);
  if (!validWorkerId || !validLeaseToken) {
    return res.status(400).json({ error: 'invalid_lease_payload' });
  }
  try {
    const released = await pool.query(
      `UPDATE engineering_improvements
          SET worker_lease_owner = NULL,
              worker_lease_token = NULL,
              worker_lease_expires_at = NULL
        WHERE id = $1
          AND status = 'queued'
          AND worker_lease_owner = $2
          AND worker_lease_token = $3
          AND worker_lease_expires_at > NOW()
       RETURNING id`,
      [req.params.id, body.workerId, body.leaseToken],
    );
    res.setHeader('Cache-Control', 'no-store');
    if (!released.rowCount) return res.status(409).json({ error: 'lease_not_found_or_expired' });
    return res.json({ released: true, executionEnabled: false, message: 'Lease released; no code was executed.' });
  } catch (error) {
    return next(error);
  }
});

app.get('/internal/execution-queue', requireIngestToken, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const result = await pool.query(
      'SELECT id, title, summary, category, priority, evidence, repository_name AS "repositoryName", repository_url AS "repositoryUrl", repository_ref AS "repositoryRef", analysis_plan AS "analysisPlan", execution_approved_at AS "executionApprovedAt", execution_approved_by AS "executionApprovedBy", approved_plan_sha256 AS "approvedPlanSha256" FROM engineering_improvements WHERE status = \'queued\' AND execution_approved_at IS NOT NULL AND approved_plan_sha256 IS NOT NULL AND (worker_lease_expires_at IS NULL OR worker_lease_expires_at <= NOW()) ORDER BY priority DESC, updated_at ASC LIMIT $1',
      [limit],
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ tasks: result.rows, count: result.rowCount, executionEnabled: false });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/tasks', requireToken, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const status = typeof req.query.status === 'string' ? req.query.status : null;
    const category = typeof req.query.category === 'string' ? req.query.category : null;
    const result = await pool.query(
      `SELECT id, title, summary, category, status, priority, impact, confidence,
              effort, risk, evidence, finding_type AS "findingType", recommended_action AS "recommendedAction",
              priority_rationale AS "priorityRationale", analysis_plan AS "analysisPlan", repository_name AS "repositoryName",
              repository_url AS "repositoryUrl", repository_ref AS "repositoryRef",
              branch_name AS "branchName", pull_request_url AS "pullRequestUrl",
              blocked_reason AS "blockedReason", triage_decision AS "triageDecision", triage_reason AS "triageReason", triaged_by AS "triagedBy", triaged_at AS "triagedAt", execution_approved_at AS "executionApprovedAt", execution_approved_by AS "executionApprovedBy", execution_approval_reason AS "executionApprovalReason", approved_plan_sha256 AS "approvedPlanSha256", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM engineering_improvements
        WHERE ($1::text IS NULL OR status = $1)
          AND ($2::text IS NULL OR category = $2)
        ORDER BY priority DESC, updated_at DESC
        LIMIT $3`,
      [status, category, limit],
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ tasks: result.rows, count: result.rowCount });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tasks/:id', requireToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, summary, category, status, priority, impact, confidence,
              effort, risk, evidence, finding_type AS "findingType", recommended_action AS "recommendedAction",
              priority_rationale AS "priorityRationale", analysis_plan AS "analysisPlan", repository_name AS "repositoryName",
              repository_url AS "repositoryUrl", repository_ref AS "repositoryRef",
              branch_name AS "branchName", pull_request_url AS "pullRequestUrl",
              blocked_reason AS "blockedReason", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM engineering_improvements WHERE id = $1 LIMIT 1`,
      [req.params.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'task_not_found' });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});


const analyzeTaskHandler = async (req, res, next) => {
  const taskId = req.params.id;
  if (typeof taskId !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(taskId)) {
    return res.status(400).json({ error: 'invalid_task_id' });
  }

  const orchestratorUrl = (process.env.ORCHESTRATOR_URL || 'http://127.0.0.1:4320').replace(/\/$/, '');
  const orchestratorToken = process.env.AGENTS_ORCHESTRATOR_TOKEN;
  if (!orchestratorToken || orchestratorToken.length < 32) {
    return res.status(503).json({ error: 'orchestrator_not_configured' });
  }

  let client;
  try {
    const found = await pool.query(
      'SELECT id, title, summary, category, evidence, status, execution_approved_at AS "executionApprovedAt" FROM engineering_improvements WHERE id = $1 LIMIT 1',
      [taskId],
    );
    if (!found.rowCount) return res.status(404).json({ error: 'task_not_found' });
    const task = found.rows[0];
    if (task.status !== 'triaged' || task.executionApprovedAt) {
      return res.status(409).json({ error: 'task_not_analyzable', status: task.status });
    }

    let orchestratorResponse;
    try {
      orchestratorResponse = await fetch(orchestratorUrl + '/v1/analyze', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + orchestratorToken,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: task.id,
          title: task.title,
          summary: task.summary,
          category: task.category,
          evidence: task.evidence || [],
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      return res.status(502).json({ error: 'orchestrator_unavailable' });
    }

    if (!orchestratorResponse.ok) {
      return res.status(502).json({ error: 'orchestrator_request_failed', upstreamStatus: orchestratorResponse.status });
    }

    const analysis = await orchestratorResponse.json();
    if (
      analysis.task_id !== task.id ||
      analysis.human_approval_required !== true ||
      analysis.execution_enabled !== false ||
      !analysis.finding ||
      !analysis.architecture ||
      !Array.isArray(analysis.agent_trace) ||
      !analysis.plan ||
      analysis.plan.humanApprovalRequired !== true ||
      analysis.plan.executionEnabled !== false
    ) {
      return res.status(502).json({ error: 'invalid_orchestrator_response' });
    }

    const persistedPlan = {
      ...analysis.plan,
      finding: analysis.finding,
      architecture: analysis.architecture,
      agentTrace: analysis.agent_trace,
      executionEnabled: false,
    };

    client = await pool.connect();
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT status, execution_approved_at AS "executionApprovedAt" FROM engineering_improvements WHERE id = $1 FOR UPDATE',
      [taskId],
    );
    if (!current.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'task_not_found' });
    }
    const fromStatus = current.rows[0].status;
    if (fromStatus !== 'triaged' || current.rows[0].executionApprovedAt) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'task_state_changed_during_analysis', status: fromStatus });
    }

    await client.query(
      "UPDATE engineering_improvements SET status = 'analyzing' WHERE id = $1",
      [taskId],
    );
    await client.query(
      "INSERT INTO engineering_improvement_workflow_events (task_id, from_status, to_status, reason, actor) VALUES ($1, $2, 'analyzing', $3, 'langgraph-orchestrator')",
      [taskId, fromStatus, 'Analysis started by the authenticated LangGraph orchestrator.'],
    );
    const updated = await client.query(
      "UPDATE engineering_improvements SET status = 'planned', analysis_plan = $2::jsonb WHERE id = $1 RETURNING id, title, status, analysis_plan AS \"analysisPlan\"",
      [taskId, JSON.stringify(persistedPlan)],
    );
    await client.query(
      "INSERT INTO engineering_improvement_workflow_events (task_id, from_status, to_status, reason, actor) VALUES ($1, 'analyzing', 'planned', $2, 'langgraph-orchestrator')",
      [taskId, 'LangGraph returned a reviewable plan; execution remains disabled.'],
    );
    await client.query('COMMIT');

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      task: updated.rows[0],
      agentTrace: analysis.agent_trace,
      humanApprovalRequired: true,
      executionEnabled: false,
    });
  } catch (error) {
    try { if (client) await client.query('ROLLBACK'); } catch {}
    return next(error);
  } finally {
    if (client) client.release();
  }
};

// Dashboard requests use the regular API token; internal ingestion keeps its separate token.
app.post('/api/tasks/:id/analyze', requireToken, analyzeTaskHandler);
app.post('/internal/tasks/:id/analyze', requireIngestToken, analyzeTaskHandler);

app.use((error, _req, res, _next) => {
  // Do not leak SQL, credentials, or internal exception details to clients.
  console.error(JSON.stringify({ event: 'request_failed', name: error?.name || 'Error' }));
  res.status(500).json({ error: 'internal_error' });
});

const server = app.listen(port, () => {
  console.log(JSON.stringify({ event: 'service_started', service: 'control-api', port }));
});

async function shutdown(signal) {
  console.log(JSON.stringify({ event: 'service_stopping', signal }));
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, requireToken };