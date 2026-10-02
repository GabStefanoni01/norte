const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4200',
    browserName: 'chromium',
    headless: true,
  },
});
