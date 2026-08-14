/**
 * Testes para validadores
 */

const {
  ValidadorEmail,
  ValidadorSenha,
  ValidadorNome,
  ValidadorTitulo,
  ValidadorConteudo,
  ValidadorData,
  ValidadorIdade,
  ValidadorURL,
  ValidadorPrioridade,
  ValidadorStatus,
  ValidadorNumero,
  ValidadorCPF,
  ValidadorLista,
} = require('../src/utils/validators');

describe('Validadores', () => {
  describe('ValidadorEmail', () => {
    it('deve validar um email correto', () => {
      const resultado = ValidadorEmail.validar('user@example.com');
      expect(resultado.valido).toBe(true);
      expect(resultado.erro).toBeUndefined();
    });

    it('deve rejeitar email vazio', () => {
      const resultado = ValidadorEmail.validar('');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('obrigatório');
    });

    it('deve rejeitar email sem arroba', () => {
      const resultado = ValidadorEmail.validar('userexample.com');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('inválido');
    });

    it('deve rejeitar email muito longo', () => {
      const emailLongo = 'a'.repeat(160) + '@example.com';
      const resultado = ValidadorEmail.validar(emailLongo);
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('muito longo');
    });

    it('deve rejeitar non-string', () => {
      const resultado = ValidadorEmail.validar(123);
      expect(resultado.valido).toBe(false);
    });
  });

  describe('ValidadorSenha', () => {
    it('deve validar uma senha forte', () => {
      const resultado = ValidadorSenha.validar('Senha123!');
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar senha sem maiúscula', () => {
      const resultado = ValidadorSenha.validar('senha123!');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('maiúscula');
    });

    it('deve rejeitar senha sem minúscula', () => {
      const resultado = ValidadorSenha.validar('SENHA123!');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('minúscula');
    });

    it('deve rejeitar senha sem número', () => {
      const resultado = ValidadorSenha.validar('SenhaAbc!');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('número');
    });

    it('deve rejeitar senha sem caractere especial', () => {
      const resultado = ValidadorSenha.validar('Senha123abc');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('especial');
    });

    it('deve rejeitar senha muito curta', () => {
      const resultado = ValidadorSenha.validar('Abc123!');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('mínimo');
    });

    it('deve aceitar senha sem caractere especial se configurado', () => {
      const resultado = ValidadorSenha.validar('Senha123', 8, false);
      expect(resultado.valido).toBe(true);
    });
  });

  describe('ValidadorNome', () => {
    it('deve validar um nome correto', () => {
      const resultado = ValidadorNome.validar('João da Silva');
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar nome muito curto', () => {
      const resultado = ValidadorNome.validar('Jo');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('mínimo');
    });

    it('deve rejeitar nome muito longo', () => {
      const resultado = ValidadorNome.validar('a'.repeat(151));
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('máximo');
    });

    it('deve rejeitar nome com números', () => {
      const resultado = ValidadorNome.validar('João123');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('inválidos');
    });

    it('deve aceitar nome com acentos', () => {
      const resultado = ValidadorNome.validar('José Luíz');
      expect(resultado.valido).toBe(true);
    });
  });

  describe('ValidadorTitulo', () => {
    it('deve validar um título correto', () => {
      const resultado = ValidadorTitulo.validar('Meu primeiro post');
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar título vazio', () => {
      const resultado = ValidadorTitulo.validar('');
      expect(resultado.valido).toBe(false);
    });

    it('deve rejeitar título muito curto', () => {
      const resultado = ValidadorTitulo.validar('abc');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('mínimo');
    });

    it('deve rejeitar título muito longo', () => {
      const resultado = ValidadorTitulo.validar('a'.repeat(300));
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('máximo');
    });
  });

  describe('ValidadorConteudo', () => {
    it('deve validar um conteúdo correto', () => {
      const resultado = ValidadorConteudo.validar('Este é um texto longo o suficiente para ser válido');
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar conteúdo muito curto', () => {
      const resultado = ValidadorConteudo.validar('abc');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('mínimo');
    });

    it('deve rejeitar conteúdo muito longo', () => {
      const resultado = ValidadorConteudo.validar('a'.repeat(6000));
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('máximo');
    });
  });

  describe('ValidadorData', () => {
    it('deve validar uma data futura', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const resultado = ValidadorData.validar(tomorrow.toISOString());
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar data no passado por padrão', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const resultado = ValidadorData.validar(yesterday.toISOString());
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('passado');
    });

    it('deve aceitar data no passado se permitido', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const resultado = ValidadorData.validar(yesterday.toISOString(), true);
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar data inválida', () => {
      const resultado = ValidadorData.validar('data-inválida');
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('inválida');
    });
  });

  describe('ValidadorIdade', () => {
    it('deve validar uma idade válida', () => {
      const resultado = ValidadorIdade.validar(25);
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar idade menor que 13', () => {
      const resultado = ValidadorIdade.validar(12);
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('mínima');
    });

    it('deve rejeitar idade maior que 120', () => {
      const resultado = ValidadorIdade.validar(150);
      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toContain('inválida');
    });

    it('deve aceitar idade vazia/null', () => {
      const resultado = ValidadorIdade.validar(null);
      expect(resultado.valido).toBe(true);
    });
  });

  describe('ValidadorURL', () => {
    it('deve validar uma URL correta', () => {
      const resultado = ValidadorURL.validar('https://example.com');
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar URL inválida', () => {
      const resultado = ValidadorURL.validar('nao-uma-url');
      expect(resultado.valido).toBe(false);
    });
  });

  describe('ValidadorPrioridade', () => {
    it('deve validar prioridades válidas', () => {
      expect(ValidadorPrioridade.validar('alta').valido).toBe(true);
      expect(ValidadorPrioridade.validar('media').valido).toBe(true);
      expect(ValidadorPrioridade.validar('baixa').valido).toBe(true);
    });

    it('deve rejeitar prioridade inválida', () => {
      const resultado = ValidadorPrioridade.validar('urgente');
      expect(resultado.valido).toBe(false);
    });
  });

  describe('ValidadorNumero', () => {
    it('deve validar um número correto', () => {
      const resultado = ValidadorNumero.validar(42);
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar número fora do intervalo', () => {
      const resultado = ValidadorNumero.validar(-5, 0, 100);
      expect(resultado.valido).toBe(false);
    });

    it('deve rejeitar non-number', () => {
      const resultado = ValidadorNumero.validar('abc');
      expect(resultado.valido).toBe(false);
    });
  });

  describe('ValidadorLista', () => {
    it('deve validar uma lista válida', () => {
      const resultado = ValidadorLista.validar(['item1', 'item2']);
      expect(resultado.valido).toBe(true);
    });

    it('deve rejeitar lista vazia', () => {
      const resultado = ValidadorLista.validar([], 1);
      expect(resultado.valido).toBe(false);
    });

    it('deve rejeitar non-array', () => {
      const resultado = ValidadorLista.validar('não-é-array');
      expect(resultado.valido).toBe(false);
    });
  });
});
