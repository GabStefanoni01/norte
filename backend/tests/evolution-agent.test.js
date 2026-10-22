const evolutionAgent = require('../src/modules/ai/agents/evolution.agent');

function planoValido() {
  return [
    { titulo: 'Fundamentos', itens: [
      { descricao: 'Estudar fundamentos e registrar aprendizados', tipo: 'aprender' },
      { descricao: 'Construir um projeto pequeno e documentá-lo', tipo: 'projeto' },
    ] },
    { titulo: 'Prática', itens: [
      { descricao: 'Praticar com exercícios progressivos', tipo: 'aprender' },
      { descricao: 'Publicar uma versão funcional do projeto', tipo: 'projeto' },
    ] },
    { titulo: 'Portfólio', itens: [
      { descricao: 'Revisar o projeto e corrigir problemas', tipo: 'aprender' },
      { descricao: 'Documentar decisões e resultados no portfólio', tipo: 'projeto' },
    ] },
  ];
}

describe('agente de evolução', () => {
  test('aceita exatamente três meses com itens concretos e tipos permitidos', () => {
    expect(evolutionAgent.validarResposta(planoValido())).toBe(true);
  });

  test('rejeita quantidade incorreta de meses', () => {
    expect(evolutionAgent.validarResposta(planoValido().slice(0, 2))).toBe(false);
  });

  test('rejeita mês sem itens suficientes', () => {
    const plano = planoValido();
    plano[0].itens = [{ descricao: 'Estudar', tipo: 'aprender' }];
    expect(evolutionAgent.validarResposta(plano)).toBe(false);
  });

  test('rejeita tipo de item desconhecido', () => {
    const plano = planoValido();
    plano[1].itens[0].tipo = 'assistir';
    expect(evolutionAgent.validarResposta(plano)).toBe(false);
  });

  test('rejeita descrições vazias', () => {
    const plano = planoValido();
    plano[2].itens[0].descricao = '  ';
    expect(evolutionAgent.validarResposta(plano)).toBe(false);
  });

  test('normaliza o plano para o formato consumido pelo módulo de planos', () => {
    const resultado = evolutionAgent.normalizarPlano(planoValido());

    expect(resultado).toHaveLength(3);
    expect(resultado[0].mes).toBe(1);
    expect(resultado[0].itens[0]).toMatchObject({
      id: 'm1i1',
      tipo: 'aprender',
      status: 'pendente',
    });
    expect(resultado[2].itens[1].id).toBe('m3i2');
  });

  test('extrai JSON envolvido em bloco markdown', () => {
    const json = JSON.stringify(planoValido());
    expect(evolutionAgent.extrairJson('```json\n' + json + '\n```')).toEqual(planoValido());
  });
});
