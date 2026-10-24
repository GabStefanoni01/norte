'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hashId, scanText } = require('../services/discovery-service/src/discover');

test('creates deterministic IDs for the same finding', () => {
  const first = hashId('maintenance-marker', 'src/app.js', 12, 'TODO: improve this');
  const second = hashId('maintenance-marker', 'src/app.js', 12, 'TODO: improve this');
  assert.equal(first, second);
  assert.match(first, /^disc-[a-f0-9]{24}$/);
});

test('detects maintenance markers without copying source line content into evidence', () => {
  const findings = scanText('src/app.js', '// FIXME: replace this later');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].category, 'maintainability');
  assert.equal(findings[0].findingType, 'maintenance_signal');
  assert.equal(findings[0].line, 1);
  assert.equal(findings[0].evidence, 'Marcador FIXME encontrado na linha 1.');
  assert.equal(findings[0].title, 'FIXME pendente no código');
  assert.equal(typeof findings[0].recommendedAction, 'string');
  assert.match(findings[0].priorityRationale, /impacto 2\/5/);
  assert.ok(findings[0].priority >= 0 && findings[0].priority <= 100);
});

test('detects empty catch blocks in JavaScript and TypeScript', () => {
  const findings = scanText('src/service.ts', 'try { work(); } catch (error) {}');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'empty-catch');
  assert.equal(findings[0].category, 'reliability');
  assert.equal(findings[0].findingType, 'potential_defect');
  assert.match(findings[0].recommendedAction, /fluxo de erro/);
  assert.match(findings[0].priorityRationale, /confiança 78%/);
});

test('does not apply JavaScript-specific rules to markdown', () => {
  const findings = scanText('docs/guide.md', 'TODO: review this\nconsole.log("example")');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'maintenance-marker');
});

test('detects console.log but never includes the logged content in evidence', () => {
  const findings = scanText('src/app.js', 'console.log("potentially sensitive value")');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'console-log');
  assert.equal(findings[0].findingType, 'code_smell');
  assert.equal(findings[0].evidence.includes('potentially sensitive value'), false);
  assert.equal(findings[0].recommendedAction.includes('dados pessoais'), true);
  assert.match(findings[0].priorityRationale, /esforço 1\/5/);
});
