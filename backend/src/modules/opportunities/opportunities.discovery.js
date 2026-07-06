const { perguntarComBusca } = require('../ai/ai.provider');

const TIPOS_VALIDOS = ['curso', 'vaga', 'bolsa', 'evento', 'programa'];

/**
 * Usa a IA com busca na web habilitada para encontrar oportunidades reais
 * e atuais. Retorna uma lista já validada no formato esperado pelo banco —
 * mas isso NÃO garante que os links estão corretos ou ainda ativos, por
 * isso o resultado sempre entra como "pendente" até um admin revisar.
 */
async function buscarOportunidadesNaWeb({ interesse, estado } = {}) {
  const systemPrompt =
    'Você busca oportunidades reais e atuais na internet para jovens brasileiros no início de carreira: ' +
    'cursos gratuitos, vagas de estágio/trainee, bolsas de estudo, programas de mentoria e eventos. ' +
    'Use a busca na web para encontrar oportunidades que existem de verdade agora, com links reais e ' +
    'verificáveis — nunca invente. Se não tiver certeza que um link é real, não inclua essa oportunidade. ' +
    'Responda APENAS com um JSON array válido, sem nenhum texto antes ou depois, sem markdown, no formato: ' +
    '[{"titulo": "string", "empresa": "string ou null", "tipo": "curso"|"vaga"|"bolsa"|"evento"|"programa", ' +
    '"descricao": "string curta", "interesse": "string ou null", "estado": "sigla de 2 letras ou null (null = remoto/nacional)", ' +
    '"gratuito": true ou false, "link": "url real"}]. ' +
    'Busque entre 5 e 10 oportunidades.';

  const mensagem =
    `Busque oportunidades ${interesse ? `na área de ${interesse}` : 'em áreas diversas'} ` +
    `${estado ? `na região de ${estado} ou remotas` : 'no Brasil (presenciais ou remotas)'}, ` +
    'adequadas para jovens que estão começando a carreira profissional.';

  const texto = await perguntarComBusca({ systemPrompt, mensagem });
  if (!texto) return [];

  const jsonLimpo = texto.trim().replace(/^```json\s*|^```\s*|```\s*$/g, '');

  let lista;
  try {
    lista = JSON.parse(jsonLimpo);
  } catch (err) {
    const erro = new Error('A IA retornou um formato inválido ao buscar oportunidades.');
    erro.status = 502;
    throw erro;
  }

  if (!Array.isArray(lista)) {
    const erro = new Error('A IA não retornou uma lista de oportunidades.');
    erro.status = 502;
    throw erro;
  }

  return lista
    .filter((item) => item && typeof item.titulo === 'string' && typeof item.link === 'string')
    .map((item) => ({
      titulo: item.titulo,
      empresa: item.empresa || null,
      categoria: item.interesse || null,
      tipo: TIPOS_VALIDOS.includes(item.tipo) ? item.tipo : 'programa',
      descricao: item.descricao || null,
      interesse: item.interesse || null,
      estado: typeof item.estado === 'string' && item.estado.length === 2 ? item.estado.toUpperCase() : null,
      gratuito: item.gratuito !== false,
      link: item.link,
    }));
}

module.exports = { buscarOportunidadesNaWeb };
