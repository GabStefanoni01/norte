'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('dashboard inline JavaScript has valid syntax', () => {
  const dashboardPath = path.join(__dirname, '..', 'dashboard', 'index.html');
  const html = fs.readFileSync(dashboardPath, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, 'expected at least one inline script');
  for (const [index, match] of scripts.entries()) {
    assert.doesNotThrow(() => new vm.Script(match[1], { filename: 'dashboard-inline-' + index + '.js' }));
  }
});

test('dashboard displays repository provenance and source locations', () => {
  const dashboardPath = path.join(__dirname, '..', 'dashboard', 'index.html');
  const html = fs.readFileSync(dashboardPath, 'utf8');
  assert.match(html, /task\.repositoryName/);
  assert.match(html, /task\.findingType/);
  assert.match(html, /findingTypeFilter/);
  assert.match(html, /task\.recommendedAction/);
  assert.match(html, /task\.priorityRationale/);
  assert.match(html, /task\.analysisPlan/);
  assert.match(html, /Plano de análise proposto/);
  assert.match(html, /Aprovação humana obrigatória/);
  assert.match(html, /Revisão humana do achado/);
  assert.match(html, /Registrar triagem/);
  assert.match(html, /Carregar histórico de triagem/);
  assert.match(html, /Transição controlada de estado/);
  assert.match(html, /Registrar transição/);
  assert.match(html, /Enviar para aprovação/);
  assert.match(html, /Aprovar plano e colocar na fila/);
  assert.match(html, /approve-execution/);
  assert.match(html, /triage-history-task-id/);
  assert.match(html, /data-triage-task-id/);
  assert.match(html, /method: 'POST'/);
  assert.match(html, /Próxima ação sugerida/);
  assert.match(html, /Por que essa prioridade/);
  assert.match(html, /task\.repositoryUrl/);
  assert.match(html, /task\.repositoryRef/);
  assert.match(html, /evidence\.path/);
  assert.match(html, /evidence\.startLine/);
});
