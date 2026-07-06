const env = require('../../config/env');

/**
 * Camada de abstração para o provedor de IA. Isolar a chamada externa aqui
 * permite trocar de provedor (ou usar um mock em testes) sem tocar no
 * restante do módulo.
 */
async function askMentor({ systemPrompt, mensagem }) {
  if (!env.aiApiKey) {
    const err = new Error(
      'Recurso de IA desativado: configure AI_API_KEY no .env para usar o mentor.'
    );
    err.status = 400;
    err.code = 'IA_NAO_CONFIGURADA';
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

/**
 * Igual ao askMentor, mas habilita a ferramenta de busca na web da própria
 * API da Anthropic — usado quando a resposta precisa de informação atual
 * da internet (ex: buscar oportunidades reais). Custa mais caro que uma
 * chamada de texto simples, por isso é usado só sob demanda, não em toda
 * interação do mentor.
 */
async function perguntarComBusca({ systemPrompt, mensagem }) {
  if (!env.aiApiKey) {
    const err = new Error(
      'Busca automática desativada: configure AI_API_KEY no .env para usar este recurso opcional. ' +
        'Sem isso, o cadastro manual de oportunidades continua funcionando normalmente.'
    );
    err.status = 400;
    err.code = 'IA_NAO_CONFIGURADA';
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
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: mensagem }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    }),
  });

  if (!response.ok) {
    const err = new Error('Falha ao consultar o provedor de IA (com busca)');
    err.status = 502;
    throw err;
  }

  const data = await response.json();

  // Com ferramentas, a resposta pode ter varios blocos (tool_use, tool_result,
  // text) intercalados — o texto final costuma vir no(s) ultimo(s) bloco(s)
  // de tipo "text", depois que o modelo ja processou os resultados da busca.
  const textos = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text);
  return textos.join('\n').trim();
}

module.exports = { askMentor, perguntarComBusca };
