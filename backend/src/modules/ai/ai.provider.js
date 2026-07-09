const env = require('../../config/env');

const MODEL = 'gemini-2.5-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Camada de abstração para o provedor de IA (Google Gemini). Isolar a
 * chamada externa aqui permite trocar de provedor (ou usar um mock em
 * testes) sem tocar no restante do módulo. Usa o mesmo modelo pra chat
 * simples e pra busca na web — só muda se a ferramenta google_search
 * está habilitada ou não.
 */
function extrairTexto(data) {
  const partes = data?.candidates?.[0]?.content?.parts || [];
  return partes
    .map((p) => p.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

function erroIaNaoConfigurada(comBusca) {
  const err = new Error(
    comBusca
      ? 'Busca automática desativada: configure GEMINI_API_KEY no .env para usar este recurso opcional. ' +
        'Sem isso, o cadastro manual de oportunidades continua funcionando normalmente.'
      : 'Recurso de IA desativado: configure GEMINI_API_KEY no .env para usar o mentor.'
  );
  err.status = 400;
  err.code = 'IA_NAO_CONFIGURADA';
  return err;
}

async function chamarGemini({ systemPrompt, mensagem, comBusca }) {
  if (!env.geminiApiKey) {
    throw erroIaNaoConfigurada(comBusca);
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: mensagem }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  if (comBusca) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(`${BASE_URL}/${MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.geminiApiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = new Error(`Falha ao consultar o Gemini${comBusca ? ' (com busca na web)' : ''}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  return extrairTexto(data);
}

async function askMentor({ systemPrompt, mensagem }) {
  return chamarGemini({ systemPrompt, mensagem, comBusca: false });
}

/**
 * Igual ao askMentor, mas habilita a busca na web do Gemini (Grounding with
 * Google Search) — usado quando a resposta precisa de informação atual da
 * internet (ex: buscar oportunidades reais em sites como LinkedIn, InfoJobs,
 * Catho etc). O Gemini pesquisa o índice público do Google, não usa APIs
 * privadas desses sites (que, no caso do LinkedIn e InfoJobs, não estão
 * disponíveis para desenvolvedores independentes).
 */
async function perguntarComBusca({ systemPrompt, mensagem }) {
  return chamarGemini({ systemPrompt, mensagem, comBusca: true });
}

module.exports = { askMentor, perguntarComBusca };
