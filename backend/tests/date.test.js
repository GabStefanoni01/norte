const { calcularIdade } = require('../src/utils/date');

describe('calcularIdade', () => {
  it('retorna null quando a data não é informada', () => {
    expect(calcularIdade(undefined)).toBeNull();
  });

  it('calcula corretamente quando o aniversário já passou este ano', () => {
    const hoje = new Date();
    const nascimento = new Date(hoje.getFullYear() - 20, 0, 1); // 1º de janeiro
    expect(calcularIdade(nascimento)).toBe(20);
  });

  it('subtrai um ano quando o aniversário ainda não chegou este ano', () => {
    const hoje = new Date();
    const nascimento = new Date(hoje.getFullYear() - 20, 11, 31); // 31 de dezembro
    const idadeEsperada = hoje.getMonth() === 11 && hoje.getDate() >= 31 ? 20 : 19;
    expect(calcularIdade(nascimento)).toBe(idadeEsperada);
  });
});
