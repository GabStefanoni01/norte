/**
 * Testes para validadores Angular
 */

import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  emailValidator,
  senhaValidator,
  senhaConfirmacaoValidator,
  nomeValidator,
  tituloValidator,
  conteudoValidator,
  idadeValidator,
  urlValidator,
  semNumerosValidator,
  apenasNumerosValidator,
  emailUnicoValidator,
} from './validators';

describe('Validadores Angular', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('emailValidator', () => {
    it('deve validar email correto', () => {
      const control = new FormControl('user@example.com');
      const result = emailValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar email sem arroba', () => {
      const control = new FormControl('userexample.com');
      const result = emailValidator()(control);

      expect(result).not.toBeNull();
      expect(result?.['email']).toBeDefined();
    });

    it('deve rejeitar email vazio', () => {
      const control = new FormControl('');
      const result = emailValidator()(control);

      expect(result).toBeNull(); // Deixar para required validator
    });

    it('deve rejeitar email muito longo', () => {
      const emailLongo = 'a'.repeat(160) + '@example.com';
      const control = new FormControl(emailLongo);
      const result = emailValidator()(control);

      expect(result?.['emailLongo']).toBeDefined();
    });
  });

  describe('senhaValidator', () => {
    it('deve validar senha forte', () => {
      const control = new FormControl('Senha123!');
      const result = senhaValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar senha sem maiúscula', () => {
      const control = new FormControl('senha123!');
      const result = senhaValidator()(control);

      expect(result?.['maiuscula']).toBe(true);
    });

    it('deve rejeitar senha sem minúscula', () => {
      const control = new FormControl('SENHA123!');
      const result = senhaValidator()(control);

      expect(result?.['minuscula']).toBe(true);
    });

    it('deve rejeitar senha sem número', () => {
      const control = new FormControl('SenhaAbc!');
      const result = senhaValidator()(control);

      expect(result?.['numero']).toBe(true);
    });

    it('deve rejeitar senha sem caractere especial', () => {
      const control = new FormControl('Senha123abc');
      const result = senhaValidator()(control);

      expect(result?.['especial']).toBe(true);
    });

    it('deve rejeitar senha muito curta', () => {
      const control = new FormControl('Abc123!');
      const result = senhaValidator()(control);

      expect(result?.['minimo']).toBeDefined();
    });
  });

  describe('senhaConfirmacaoValidator', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        senha: new FormControl('Senha123!'),
        confirmacao: new FormControl(''),
      });
    });

    it('deve validar confirmação correta', () => {
      form.get('confirmacao')?.setValue('Senha123!');
      form.get('confirmacao')?.setValidators(senhaConfirmacaoValidator('senha'));

      const result = form.get('confirmacao')?.errors;

      expect(result).toBeNull();
    });

    it('deve rejeitar confirmação diferente', () => {
      form.get('confirmacao')?.setValue('SenhaErrada123!');
      form.get('confirmacao')?.setValidators(senhaConfirmacaoValidator('senha'));
      form.get('confirmacao')?.updateValueAndValidity();

      const result = form.get('confirmacao')?.errors;

      expect(result?.['senhasNaoConferem']).toBe(true);
    });
  });

  describe('nomeValidator', () => {
    it('deve validar nome correto', () => {
      const control = new FormControl('João Silva');
      const result = nomeValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar nome muito curto', () => {
      const control = new FormControl('Jo');
      const result = nomeValidator()(control);

      expect(result?.['nomeMinimo']).toBeDefined();
    });

    it('deve rejeitar nome muito longo', () => {
      const control = new FormControl('a'.repeat(151));
      const result = nomeValidator()(control);

      expect(result?.['nomeMaximo']).toBeDefined();
    });

    it('deve rejeitar nome com números', () => {
      const control = new FormControl('João123');
      const result = nomeValidator()(control);

      expect(result?.['nomeInvalido']).toBeDefined();
    });

    it('deve aceitar nome com acentos', () => {
      const control = new FormControl('José Luíz');
      const result = nomeValidator()(control);

      expect(result).toBeNull();
    });

    it('deve aceitar nome com apóstrofo e hífen', () => {
      const control = new FormControl("D'Artagnan Silva-Costa");
      const result = nomeValidator()(control);

      expect(result).toBeNull();
    });
  });

  describe('tituloValidator', () => {
    it('deve validar título correto', () => {
      const control = new FormControl('Meu Título');
      const result = tituloValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar título muito curto', () => {
      const control = new FormControl('abc');
      const result = tituloValidator(5, 250)(control);

      expect(result?.['tituloMinimo']).toBeDefined();
    });

    it('deve rejeitar título muito longo', () => {
      const control = new FormControl('a'.repeat(300));
      const result = tituloValidator(5, 250)(control);

      expect(result?.['tituloMaximo']).toBeDefined();
    });
  });

  describe('conteudoValidator', () => {
    it('deve validar conteúdo correto', () => {
      const control = new FormControl('Este é um conteúdo válido com mais de 10 caracteres');
      const result = conteudoValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar conteúdo muito curto', () => {
      const control = new FormControl('abc');
      const result = conteudoValidator(10, 5000)(control);

      expect(result?.['conteudoMinimo']).toBeDefined();
    });

    it('deve rejeitar conteúdo muito longo', () => {
      const control = new FormControl('a'.repeat(6000));
      const result = conteudoValidator(10, 5000)(control);

      expect(result?.['conteudoMaximo']).toBeDefined();
    });
  });

  describe('idadeValidator', () => {
    it('deve validar idade válida', () => {
      const control = new FormControl(25);
      const result = idadeValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar idade menor que 13', () => {
      const control = new FormControl(12);
      const result = idadeValidator()(control);

      expect(result?.['idadeMinima']).toBeDefined();
    });

    it('deve rejeitar idade maior que 120', () => {
      const control = new FormControl(150);
      const result = idadeValidator()(control);

      expect(result?.['idadeMaxima']).toBeDefined();
    });

    it('deve rejeitar valor não-numérico', () => {
      const control = new FormControl('abc');
      const result = idadeValidator()(control);

      expect(result?.['idadeNumerica']).toBe(true);
    });
  });

  describe('urlValidator', () => {
    it('deve validar URL correta', () => {
      const control = new FormControl('https://example.com');
      const result = urlValidator()(control);

      expect(result).toBeNull();
    });

    it('deve validar URL com protocolo http', () => {
      const control = new FormControl('http://example.com');
      const result = urlValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar URL inválida', () => {
      const control = new FormControl('nao-uma-url');
      const result = urlValidator()(control);

      expect(result?.['urlInvalida']).toBeDefined();
    });
  });

  describe('semNumerosValidator', () => {
    it('deve aceitar texto sem números', () => {
      const control = new FormControl('João Silva');
      const result = semNumerosValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar texto com números', () => {
      const control = new FormControl('João123');
      const result = semNumerosValidator()(control);

      expect(result?.['contemNumeros']).toBe(true);
    });
  });

  describe('apenasNumerosValidator', () => {
    it('deve aceitar apenas números', () => {
      const control = new FormControl('123456');
      const result = apenasNumerosValidator()(control);

      expect(result).toBeNull();
    });

    it('deve rejeitar texto com letras', () => {
      const control = new FormControl('123abc');
      const result = apenasNumerosValidator()(control);

      expect(result?.['apenasNumeros']).toBe(true);
    });
  });

  describe('emailUnicoValidator (Assíncrono)', () => {
    it('deve validar email único', (done) => {
      const emailServiceMock = {
        verificarEmailExistente: (email: string) => Promise.resolve(false),
      };

      const control = new FormControl('novo@example.com');
      const validator = emailUnicoValidator(emailServiceMock);

      validator(control).then((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('deve rejeitar email em uso', (done) => {
      const emailServiceMock = {
        verificarEmailExistente: (email: string) => Promise.resolve(true),
      };

      const control = new FormControl('existente@example.com');
      const validator = emailUnicoValidator(emailServiceMock);

      validator(control).then((result) => {
        expect(result?.['emailEmUso']).toBe(true);
        done();
      });
    });

    it('deve aceitar email vazio', (done) => {
      const emailServiceMock = {
        verificarEmailExistente: (email: string) => Promise.resolve(true),
      };

      const control = new FormControl('');
      const validator = emailUnicoValidator(emailServiceMock);

      validator(control).then((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('Integração com FormGroup', () => {
    it('deve validar formulário de registro completo', () => {
      const form = new FormGroup({
        email: new FormControl('user@example.com', emailValidator()),
        nome: new FormControl('João Silva', nomeValidator()),
        senha: new FormControl('Senha123!', senhaValidator()),
        confirmacao: new FormControl('Senha123!', senhaConfirmacaoValidator('senha')),
        idade: new FormControl(25, idadeValidator()),
      });

      expect(form.valid).toBe(true);
    });

    it('deve invalidar formulário com dados incorretos', () => {
      const form = new FormGroup({
        email: new FormControl('invalid-email', emailValidator()),
        nome: new FormControl('Jo', nomeValidator()),
        senha: new FormControl('abc123', senhaValidator()),
        idade: new FormControl(12, idadeValidator()),
      });

      expect(form.valid).toBe(false);
      expect(form.get('email')?.invalid).toBe(true);
      expect(form.get('nome')?.invalid).toBe(true);
      expect(form.get('senha')?.invalid).toBe(true);
      expect(form.get('idade')?.invalid).toBe(true);
    });
  });
});
