const { PERGUNTAS } = require('../src/modules/discovery/discovery.data');
const discoveryService = require('../src/modules/discovery/discovery.service');

describe('discoveryService.calcularResultado', () => {
  it('rejeita quantidade errada de respostas', () => {
    expect(() => discoveryService.calcularResultado([])).toThrow();
  });

  it('calcula o perfil dominante corretamente quando todas as respostas são da mesma categoria', () => {
    const respostas = PERGUNTAS.map((p) => ({
      perguntaId: p.id,
      opcaoId: p.opcoes.find((o) => o.categoria === 'analitico').id,
    }));

    const resultado = discoveryService.calcularResultado(respostas);

    expect(resultado.perfilDominante).toBe('analitico');
    expect(resultado.areasSugeridas).toContain('Desenvolvimento');
  });

  it('rejeita pergunta inválida', () => {
    const respostas = PERGUNTAS.map((p) => ({ perguntaId: p.id, opcaoId: 'a' }));
    respostas[0].perguntaId = 'inexistente';

    expect(() => discoveryService.calcularResultado(respostas)).toThrow();
  });
});
