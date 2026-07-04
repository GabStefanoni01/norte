const { PERGUNTAS } = require('../src/modules/discovery/discovery.data');
const discoveryService = require('../src/modules/discovery/discovery.service');

describe('discoveryService.calcularResultado', () => {
  it('rejeita quantidade errada de respostas', () => {
    expect(() => discoveryService.calcularResultado([])).toThrow();
  });

  it('calcula o perfil dominante corretamente quando a maioria das respostas é da mesma categoria', () => {
    const respostas = PERGUNTAS.map((p) => ({
      perguntaId: p.id,
      opcaoId: p.opcoes.find((o) => o.categoria === 'analitico').id,
    }));

    const resultado = discoveryService.calcularResultado(respostas);

    expect(resultado.perfilDominante).toBe('analitico');
    expect(resultado.areasSugeridas).toContain('Desenvolvimento');
    expect(resultado.pontuacao.analitico).toBe(PERGUNTAS.length);
  });

  it('identifica um perfil secundário diferente do dominante', () => {
    const respostas = PERGUNTAS.map((p, i) => ({
      perguntaId: p.id,
      // Maioria analítico, uma minoria social — só pra garantir que existe
      // um segundo colocado calculável.
      opcaoId: p.opcoes.find((o) => o.categoria === (i === 0 ? 'social' : 'analitico')).id,
    }));

    const resultado = discoveryService.calcularResultado(respostas);

    expect(resultado.perfilDominante).toBe('analitico');
    expect(resultado.perfilSecundario).toBe('social');
    expect(resultado.areasSecundarias).toBeDefined();
  });

  it('rejeita pergunta inválida', () => {
    const respostas = PERGUNTAS.map((p) => ({ perguntaId: p.id, opcaoId: 'a' }));
    respostas[0].perguntaId = 'inexistente';

    expect(() => discoveryService.calcularResultado(respostas)).toThrow();
  });
});
