const fs = require('node:fs');
const path = require('node:path');

const apiUrl = (process.env.NORTE_API_URL || '').trim();

if (process.env.VERCEL === '1' && !apiUrl) {
  console.error('NORTE_API_URL precisa estar configurada no ambiente da Vercel.');
  process.exit(1);
}

if (!apiUrl) {
  // Local/CI build: keep the checked-in localhost default.
  process.exit(0);
}

let parsedUrl;
try {
  parsedUrl = new URL(apiUrl);
} catch {
  console.error('NORTE_API_URL precisa ser uma URL absoluta válida.');
  process.exit(1);
}

if (process.env.VERCEL === '1' && parsedUrl.protocol !== 'https:') {
  console.error('NORTE_API_URL deve usar HTTPS na Vercel.');
  process.exit(1);
}

if (parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash) {
  console.error('NORTE_API_URL deve conter apenas a origem da API, sem caminho, query ou hash.');
  process.exit(1);
}

const target = path.join(__dirname, '../src/environments/environment.prod.ts');
const contents = `// Gerado durante o build a partir de NORTE_API_URL.
export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl)},
};
`;

fs.writeFileSync(target, contents);
console.log('URL da API configurada para o build de produção.');
