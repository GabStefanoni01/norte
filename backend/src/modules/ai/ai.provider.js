const env = require('../../config/env');
const logger = require('../../utils/logger');

const MODEL = 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function extrairTexto(data) {
  const partes = data?.candidates?.[0]?.content?.parts || [];
  return partes.map((p) => p.text).filter(Boolean).join('\n').trim();
}

function erroIaNaoConfigurada(comBusca) {
  const err = new Error(
    comBusca
      ? 'Busca automática desativada: configure GEMINI_API_KEY no .env para usar este recurso opcional. Sem isso, o cadastro manual de oportunidades continua funcionando normalmente.'
      : 'Recurso de IA desativado: configure GEMINI_API_KEY no .env para usar o mentor.'
  );
  err.status = 400;
  err.code = 'IA_NAO_CONFIGURADA';
  return err;
}

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function respostaRecuperavel(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function chamarGemini({ systemPrompt, mensagem, comBusca }) {
  if (!env.geminiApiKey) throw erroIaNaoConfigurada(comBusca);

  const body = {
    contents: [{ role: 'user', parts: [{ text: mensagem }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };
  if (comBusca) body.tools = [{ google_search: {} }];

  for (let tentativa = 0; tentativa <= env.aiMaxRetries; tentativa += 1) {
    try {
      const response = await fetch(BASE_URL + '/' + MODEL + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(env.aiTimeoutMs),
      });

      if (response.ok) return extrairTexto(await response.json());

      const err = new Error('Falha ao consultar o Gemini' + (comBusca ? ' (com busca na web)' : ''));
      err.status = 502;
      err.recuperavel = respostaRecuperavel(response.status);
      if (!err.recuperavel || tentativa === env.aiMaxRetries) throw err;
      logger.warn('ai.provider.retry', { provider: 'gemini', statusCode: response.status, attempt: tentativa + 1 });
    } catch (err) {
      const recuperavel = err.recuperavel ?? err.name === 'TimeoutError' || err.name === 'AbortError' || err.status === 502;
      if (!recuperavel || tentativa === env.aiMaxRetries) {
        if (!err.status) err.status = 502;
        throw err;
      }
      logger.warn('ai.provider.retry', { provider: 'gemini', reason: err.name || 'network_error', attempt: tentativa + 1 });
    }
    await aguardar(250 * 2 ** tentativa);
  }
}

async function askMentor({ systemPrompt, mensagem }) {
  return chamarGemini({ systemPrompt, mensagem, comBusca: false });
}

async function perguntarComBusca({ systemPrompt, mensagem }) {
  return chamarGemini({ systemPrompt, mensagem, comBusca: true });
}

module.exports = { askMentor, perguntarComBusca };
