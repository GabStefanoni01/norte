const env = require('../../config/env');
const { usuarioTemConsentimentoValido } = require('../policy/policy.service');
const { askMentor } = require('../ai/ai.provider');
const { buildUserContext } = require('../ai/ai.context');

async function gerarCurriculoComIA(userId) {
  if (!env.geminiApiKey) return null;
  if (!(await usuarioTemConsentimentoValido(userId))) return null;

  try {
    const context = await buildUserContext(userId);

    const systemPrompt =
      'Você escreve currículos para jovens brasileiros no início de carreira, muitas vezes sem ' +
      'experiência formal. Transforme o perfil da pessoa em um currículo em texto simples (sem markdown, ' +
      'sem asteriscos), profissional mas acessível, destacando projetos pessoais, cursos e habilidades como ' +
      'experiência válida. Use seções: nome/contato, objetivo, perfil, formação, projetos, cursos e ' +
      'aprendizados, habilidades. Seja específico e evite frases genéricas de efeito.';

    const mensagem = `Dados do usuário:\n${JSON.stringify(context, null, 2)}`;

    const texto = await askMentor({ systemPrompt, mensagem });
    return texto?.trim() || null;
  } catch (err) {
    console.error('Não foi possível gerar currículo via IA:', err.message);
    return null;
  }
}

async function gerarFeedbackEntrevistaComIA(userId, perguntasRespostas) {
  if (!env.geminiApiKey) return null;
  if (!(await usuarioTemConsentimentoValido(userId))) return null;

  try {
    const systemPrompt =
      'Você é um recrutador experiente dando feedback construtivo para um jovem que acabou de ' +
      'simular uma entrevista de emprego. Analise as respostas dele e escreva um feedback em português ' +
      'do Brasil, em texto simples (sem markdown), com 3 a 5 parágrafos curtos: o que foi bem, o que ' +
      'pode melhorar, e uma dica prática (ex: técnica STAR, ser mais específico, quantificar resultados). ' +
      'Seja encorajador mas honesto — não elogie vagamente.';

    const mensagem = perguntasRespostas
      .map((pr, i) => `Pergunta ${i + 1}: ${pr.pergunta}\nResposta: ${pr.resposta}`)
      .join('\n\n');

    const texto = await askMentor({ systemPrompt, mensagem });
    return texto?.trim() || null;
  } catch (err) {
    console.error('Não foi possível gerar feedback de entrevista via IA:', err.message);
    return null;
  }
}

module.exports = { gerarCurriculoComIA, gerarFeedbackEntrevistaComIA };
