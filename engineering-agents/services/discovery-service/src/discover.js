'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_API_URL = 'http://localhost:4310';
const MAX_FILES = 5000;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FINDINGS_PER_RUN = 100;
const EXTENSIONS = new Set([
  '.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx', '.json', '.html', '.css',
  '.scss', '.sql', '.yml', '.yaml', '.sh', '.py', '.java', '.go', '.php',
  '.vue', '.svelte',
]);
const IGNORED_DIRECTORIES = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.angular',
  '.vercel', 'vendor', 'out', 'target', 'engineering-agents',
]);
const IGNORED_FILES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb',
]);

function hashId(rule, relativePath, lineNumber, text) {
  return 'disc-' + crypto.createHash('sha256')
    .update([rule, relativePath.replace(/\\/g, '/'), lineNumber, text.trim()].join('\n'))
    .digest('hex')
    .slice(0, 24);
}

function scanText(relativePath, content) {
  const extension = path.extname(relativePath).toLowerCase();
  const isCode = ['.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.php', '.vue', '.svelte'].includes(extension);
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line)) {
      const marker = line.match(/\b(TODO|FIXME|HACK|XXX)\b/i)?.[1]?.toUpperCase() || 'TODO';
      findings.push({
        rule: 'maintenance-marker',
        title: marker + ' pendente no código',
        summary: 'Foi encontrado um marcador ' + marker + ' que pode indicar trabalho pendente. Verifique o contexto e decida se a tarefa ainda é necessária ou se o marcador pode ser removido.',
        category: 'maintainability',
        priority: marker === 'FIXME' || marker === 'HACK' ? 38 : 25,
        impact: marker === 'FIXME' || marker === 'HACK' ? 2 : 1,
        confidence: 0.82,
        effort: 1,
        risk: 1,
        line: index + 1,
        evidence: 'Marcador ' + marker + ' encontrado na linha ' + (index + 1) + '.',
      });
    }

    if (isCode && /\bconsole\.log\s*\(/.test(line) && !/(^|[/\\])(test|tests|spec|specs|scripts?)([/\\]|$)/i.test(relativePath)) {
      findings.push({
        rule: 'console-log',
        title: 'console.log no código da aplicação',
        summary: 'Foi encontrado console.log em um arquivo de código. Avalie se a mensagem deve ser removida ou substituída por logging estruturado com nível, contexto e tratamento adequado de dados sensíveis.',
        category: 'reliability',
        priority: 22,
        impact: 1,
        confidence: 0.72,
        effort: 1,
        risk: 1,
        line: index + 1,
        evidence: 'Chamada console.log identificada na linha ' + (index + 1) + '; o conteúdo da linha não é enviado para a fila.',
      });
    }
  }

  if (isCode && ['.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx'].includes(extension)) {
    const emptyCatch = /catch\s*(?:\([^)]*\)\s*)?\{\s*\}/g;
    let match;
    while ((match = emptyCatch.exec(content)) !== null) {
      const line = content.slice(0, match.index).split(/\r?\n/).length;
      findings.push({
        rule: 'empty-catch',
        title: 'Bloco catch vazio',
        summary: 'Um bloco catch vazio pode ocultar erros e dificultar a observabilidade. Confirme se o erro é intencionalmente ignorado; caso contrário, trate-o explicitamente ou registre contexto seguro.',
        category: 'reliability',
        priority: 48,
        impact: 3,
        confidence: 0.78,
        effort: 2,
        risk: 2,
        line,
        evidence: 'Bloco catch sem tratamento detectado próximo à linha ' + line + '.',
      });
    }
  }

  return findings;
}

async function collectFiles(root) {
  const files = [];
  const pending = [root];

  while (pending.length > 0 && files.length < MAX_FILES) {
    const directory = pending.pop();
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.cache')) pending.push(absolute);
        continue;
      }
      if (!entry.isFile() || IGNORED_FILES.has(entry.name) || entry.name.startsWith('.env')) continue;
      if (!EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      files.push(absolute);
    }
  }

  return files;
}

async function scanRepository(root) {
  const resolvedRoot = path.resolve(root);
  const files = await collectFiles(resolvedRoot);
  const findings = [];

  for (const file of files) {
    if (findings.length >= MAX_FINDINGS_PER_RUN) break;
    let stat;
    try {
      stat = await fs.stat(file);
      if (stat.size > MAX_FILE_BYTES) continue;
      const content = await fs.readFile(file, 'utf8');
      const relativePath = path.relative(resolvedRoot, file).split(path.sep).join('/');
      const found = scanText(relativePath, content);
      for (const item of found) {
        if (findings.length >= MAX_FINDINGS_PER_RUN) break;
        findings.push({ ...item, path: relativePath });
      }
    } catch {
      // Files that disappear or cannot be read are skipped without stopping discovery.
    }
  }

  return { filesScanned: files.length, findings };
}

async function submitFinding(apiUrl, token, finding, repository) {
  const id = hashId(finding.rule, finding.path, finding.line, finding.evidence);
  const payload = {
    id,
    title: finding.title,
    summary: finding.summary,
    repositoryName: repository.name,
    ...(repository.url ? { repositoryUrl: repository.url } : {}),
    ...(repository.ref ? { repositoryRef: repository.ref } : {}),
    category: finding.category,
    priority: finding.priority,
    impact: finding.impact,
    confidence: finding.confidence,
    effort: finding.effort,
    risk: finding.risk,
    evidence: [{
      description: finding.evidence,
      path: finding.path,
      startLine: finding.line,
      endLine: finding.line,
    }],
  };

  const response = await fetch(new URL('/internal/tasks', apiUrl), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  if (response.status === 201) return 'created';
  if (response.status === 200) return 'updated';
  if (response.status === 409) return 'duplicate';
  if (response.status === 401) throw new Error('A API recusou AGENTS_INGEST_TOKEN. Confira o .env.');
  throw new Error('A API recusou um achado (HTTP ' + response.status + ').');
}

async function main() {
  const token = process.env.AGENTS_INGEST_TOKEN;
  if (!token || token.length < 32) {
    throw new Error('AGENTS_INGEST_TOKEN precisa estar configurado com pelo menos 32 caracteres.');
  }

  const root = process.env.DISCOVERY_REPO_PATH || path.resolve(__dirname, '../../../..');
  const repository = {
    name: (process.env.DISCOVERY_REPOSITORY_NAME || path.basename(path.resolve(root)) || 'Repository').trim(),
    url: process.env.DISCOVERY_REPOSITORY_URL?.trim() || null,
    ref: process.env.DISCOVERY_REPOSITORY_REF?.trim() || null,
  };
  if (!repository.name || repository.name.length > 120) {
    throw new Error('DISCOVERY_REPOSITORY_NAME deve ter entre 1 e 120 caracteres.');
  }
  if (repository.url) {
    let parsedRepositoryUrl;
    try { parsedRepositoryUrl = new URL(repository.url); } catch { throw new Error('DISCOVERY_REPOSITORY_URL não é uma URL válida.'); }
    if (parsedRepositoryUrl.protocol !== 'https:' || parsedRepositoryUrl.username || parsedRepositoryUrl.password || parsedRepositoryUrl.search || parsedRepositoryUrl.hash) {
      throw new Error('DISCOVERY_REPOSITORY_URL deve ser HTTPS e não pode conter credenciais, query ou fragmento.');
    }
  }
  if (repository.ref && (repository.ref.length > 255 || /[\r\n]/.test(repository.ref))) {
    throw new Error('DISCOVERY_REPOSITORY_REF deve ter até 255 caracteres e não pode conter quebras de linha.');
  }
  const apiUrl = (process.env.CONTROL_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
  const parsedApiUrl = new URL(apiUrl);
  if (parsedApiUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedApiUrl.hostname)) {
    throw new Error('CONTROL_API_URL precisa usar HTTPS fora do ambiente local.');
  }

  const { filesScanned, findings } = await scanRepository(root);
  let created = 0;
  let updated = 0;
  let duplicates = 0;
  let failed = 0;

  for (const finding of findings) {
    try {
      const result = await submitFinding(apiUrl, token, finding, repository);
      if (result === 'created') created += 1;
      else if (result === 'updated') updated += 1;
      else duplicates += 1;
    } catch (error) {
      failed += 1;
      console.error(JSON.stringify({
        event: 'finding_submit_failed',
        rule: finding.rule,
        path: finding.path,
        line: finding.line,
        message: error?.message || 'Erro desconhecido',
      }));
      if (error?.name === 'AbortError' || error?.name === 'TimeoutError' || /AGENTS_INGEST_TOKEN|HTTPS|HTTP 5/.test(error?.message || '')) {
        break;
      }
    }
  }

  console.log(JSON.stringify({
    event: 'discovery_completed',
    repository: repository.name,
    repositoryUrl: repository.url,
    repositoryRef: repository.ref,
    filesScanned,
    findingsDetected: findings.length,
    tasksCreated: created,
    tasksUpdated: updated,
    duplicates,
    failed,
    capped: findings.length >= MAX_FINDINGS_PER_RUN,
  }));

  if (failed > 0) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      event: 'discovery_failed',
      name: error?.name || 'Error',
      message: error?.message || 'Erro desconhecido',
    }));
    process.exitCode = 1;
  });
}

module.exports = { hashId, scanText, scanRepository };
