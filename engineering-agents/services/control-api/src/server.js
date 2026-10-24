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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    const validId = typeof body.id === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(body.id);
    const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (!validId || !validText(body.title, 200) || !validText(body.summary, 4000) || !categories.has(body.category) || !findingTypes.has(findingType)) {
      return res.status(400).json({ error: 'invalid_task_payload' });
    }
    if ((recommendedAction !== null && !validText(recommendedAction, 2000)) ||
        (priorityRationale !== null && !validText(priorityRationale, 2000))) {
      return res.status(400).json({ error: 'invalid_recommendation_fields' });
    }
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
         repository_name, repository_url, repository_ref, finding_type, recommended_action, priority_rationale)
       VALUES ($1, $2, $3, $4, 'discovered', $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16)
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
         recommended_action = COALESCE(engineering_improvements.recommended_action, EXCLUDED.recommended_action),
         priority_rationale = COALESCE(engineering_improvements.priority_rationale, EXCLUDED.priority_rationale)
       WHERE (engineering_improvements.repository_name IS NULL AND EXCLUDED.repository_name IS NOT NULL)
          OR (engineering_improvements.repository_url IS NULL AND EXCLUDED.repository_url IS NOT NULL)
          OR (engineering_improvements.repository_ref IS NULL AND EXCLUDED.repository_ref IS NOT NULL)
          OR (engineering_improvements.finding_type IS NULL AND EXCLUDED.finding_type IS NOT NULL)
          OR engineering_improvements.priority IS DISTINCT FROM EXCLUDED.priority
          OR engineering_improvements.impact IS DISTINCT FROM EXCLUDED.impact
          OR engineering_improvements.confidence IS DISTINCT FROM EXCLUDED.confidence
          OR engineering_improvements.effort IS DISTINCT FROM EXCLUDED.effort
          OR engineering_improvements.risk IS DISTINCT FROM EXCLUDED.risk
          OR (engineering_improvements.recommended_action IS NULL AND EXCLUDED.recommended_action IS NOT NULL)
          OR (engineering_improvements.priority_rationale IS NULL AND EXCLUDED.priority_rationale IS NOT NULL)
       RETURNING id, title, category, status, priority, created_at AS "createdAt", (xmax = 0) AS inserted`,
      [body.id, body.title.trim(), body.summary.trim(), body.category, priority, impact, confidence, effort, risk,
        JSON.stringify(evidence), repositoryName?.trim() || null, repositoryUrl, repositoryRef, findingType, recommendedAction, priorityRationale],
    );
    if (!result.rowCount) return res.status(409).json({ error: 'task_already_exists' });
    const statusCode = result.rows[0].inserted ? 201 : 200;
    return res.status(statusCode).json({ task: result.rows[0] });
  } catch (error) {
    next(error);
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
              priority_rationale AS "priorityRationale", repository_name AS "repositoryName",
              repository_url AS "repositoryUrl", repository_ref AS "repositoryRef",
              branch_name AS "branchName", pull_request_url AS "pullRequestUrl",
              blocked_reason AS "blockedReason", created_at AS "createdAt", updated_at AS "updatedAt"
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
              effort, risk, evidence, finding_type AS "findingType", repository_name AS "repositoryName",
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