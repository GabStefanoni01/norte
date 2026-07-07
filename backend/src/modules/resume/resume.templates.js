/**
 * Monta um currículo em texto simples a partir dos dados do usuário, sem
 * depender de IA. Segue a lógica do Módulo 6 da especificação: transformar
 * "não tenho experiência" em "projetos pessoais, cursos, habilidades".
 */
function montarCurriculoTemplate(dados) {
  const {
    nome,
    email,
    cidade,
    estado,
    escolaridade,
    objetivos,
    habilidades,
    interesses,
    perfilDominante,
    projetosConcluidos,
    cursosConcluidos,
  } = dados;

  const linhas = [];

  linhas.push(nome.toUpperCase());
  linhas.push([cidade, estado].filter(Boolean).join(' / ') + (email ? ` — ${email}` : ''));
  linhas.push('');

  if (objetivos) {
    linhas.push('OBJETIVO');
    linhas.push(objetivos);
    linhas.push('');
  }

  linhas.push('PERFIL');
  if (perfilDominante) {
    linhas.push(
      `Perfil ${perfilDominante}, identificado através do teste de descoberta pessoal do Norte.` +
        (interesses?.length ? ` Interesse em: ${interesses.join(', ')}.` : '')
    );
  } else if (interesses?.length) {
    linhas.push(`Interesse em: ${interesses.join(', ')}.`);
  } else {
    linhas.push('Em desenvolvimento ativo de habilidades e experiência profissional.');
  }
  linhas.push('');

  if (escolaridade) {
    linhas.push('FORMAÇÃO');
    linhas.push(escolaridade);
    linhas.push('');
  }

  linhas.push('PROJETOS');
  if (projetosConcluidos?.length) {
    projetosConcluidos.forEach((p) => linhas.push(`- ${p}`));
  } else {
    linhas.push('- Em construção: complete etapas do seu plano de evolução no Norte para preencher esta seção.');
  }
  linhas.push('');

  linhas.push('CURSOS E APRENDIZADOS');
  if (cursosConcluidos?.length) {
    cursosConcluidos.forEach((c) => linhas.push(`- ${c}`));
  } else {
    linhas.push('- Em construção: complete etapas do seu plano de evolução no Norte para preencher esta seção.');
  }
  linhas.push('');

  if (habilidades?.length) {
    linhas.push('HABILIDADES');
    linhas.push(habilidades.join(', '));
  }

  return linhas.join('\n').trim();
}

function montarFeedbackEntrevistaTemplate() {
  return [
    'Boa iniciativa em praticar suas respostas — isso já coloca você à frente de muita gente.',
    '',
    'Algumas dicas gerais pra fortalecer suas respostas:',
    '- Use a técnica STAR: descreva a Situação, a Tarefa, a Ação que você tomou e o Resultado.',
    '- Seja específico: em vez de "trabalhei em equipe", conte um exemplo concreto de quando isso aconteceu.',
    '- Quantifique quando possível: números e resultados concretos ficam mais memoráveis.',
    '- Não tenha medo de falar sobre projetos pessoais e cursos — eles contam como experiência real.',
    '',
    'Continue praticando! Cada simulação te deixa mais confiante pra entrevista de verdade.',
  ].join('\n');
}

module.exports = { montarCurriculoTemplate, montarFeedbackEntrevistaTemplate };
