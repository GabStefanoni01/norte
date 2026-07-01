const env = require('../../config/env');

/**
 * Camada de abstração para o provedor de IA. Isolar a chamada externa aqui
 * permite trocar de provedor (ou usar um mock em testes) sem tocar no
 * restante do módulo.
 */
async function askMentor({ systemPrompt, mensagem }) {
  if (!env.aiApiKey) {
    const err = new Error('AI_API_KEY não configurada');
    err.status = 500;
    throw err;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.aiApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: mensagem }],
    }),
  });

  if (!response.ok) {
    const err = new Error('Falha ao consultar o provedor de IA');
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const textBlock = data.content?.find((block) => block.type === 'text');

  return textBlock?.text || '';
}

module.exports = { askMentor };
