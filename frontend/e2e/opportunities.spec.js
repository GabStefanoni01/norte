const fs = require('fs');
const path = require('path');
const { test, expect } = require('playwright/test');

const auth = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '.auth.json'), 'utf8'),
);

test.beforeEach(async ({ page }) => {
  page.on('response', async (response) => {
    if (response.request().method() === 'GET' && /\/opportunities(?:\?.*)?$/.test(response.url())) {
      let body = '';
      try { body = await response.text(); } catch { body = '<body unavailable>'; }
      console.log('[E2E] GET opportunities', response.status(), body);
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes('localhost:3000')) {
      console.log('[E2E] API request failed', request.method(), request.url(), request.failure()?.errorText);
    }
  });

  await page.addInitScript((token) => {
    localStorage.setItem('norte_token', token);
  }, auth.token);
});

test('fluxo principal de salvar e remover oportunidade', async ({ page }) => {
  await page.goto('/oportunidades');
  await expect(page.getByRole('heading', { name: 'Encontre seu próximo passo' })).toBeVisible();

  const card = page.locator('article').filter({ hasText: 'Oportunidade E2E Norte' });
  await expect(card).toBeVisible();

  const saveButton = card.getByRole('button', { name: 'Salvar oportunidade' });
  await saveButton.click();

  await expect(card.getByRole('button', { name: 'Remover oportunidade das salvas' })).toBeVisible();

  await page.getByRole('button', { name: 'Minhas salvas' }).click();
  await expect(page.getByRole('heading', { name: 'Oportunidades salvas' })).toBeVisible();
  await expect(page.getByText('Oportunidade E2E Norte')).toBeVisible();

  const savedCard = page.locator('article').filter({ hasText: 'Oportunidade E2E Norte' });
  await savedCard.getByRole('button', { name: 'Remover oportunidade das salvas' }).click();

  await expect(page.getByText('Você ainda não salvou nenhuma oportunidade')).toBeVisible();
});
