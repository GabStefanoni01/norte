/**
 * Validadores customizados para formulários Angular
 * Uso: form.get('email').setValidators(emailValidator)
 */

import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';

/**
 * Validador de Email
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Deixar para required validator
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valido = emailRegex.test(control.value);

    if (!valido) {
      return { email: { valor: control.value } };
    }

    if (control.value.length > 150) {
      return { emailLongo: { max: 150, atual: control.value.length } };
    }

    return null;
  };
}

/**
 * Validador de Senha
 */
export function senhaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const erros: { [key: string]: any } = {};
    const senha = control.value;

    if (senha.length < 8) {
      erros['minimo'] = { min: 8, atual: senha.length };
    }

    if (senha.length > 255) {
      erros['maximo'] = { max: 255, atual: senha.length };
    }

    if (!/[A-Z]/.test(senha)) {
      erros['maiuscula'] = true;
    }

    if (!/[a-z]/.test(senha)) {
      erros['minuscula'] = true;
    }

    if (!/[0-9]/.test(senha)) {
      erros['numero'] = true;
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha)) {
      erros['especial'] = true;
    }

    return Object.keys(erros).length > 0 ? erros : null;
  };
}

/**
 * Validador de confirmação de senha
 */
export function senhaConfirmacaoValidator(senhaCampo: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.parent) {
      return null;
    }

    const senhaControl = control.parent.get(senhaCampo);
    if (!senhaControl) {
      return null;
    }

    if (control.value !== senhaControl.value) {
      return { senhasNaoConferem: true };
    }

    return null;
  };
}

/**
 * Validador de Nome
 */
export function nomeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const nomeLimpo = control.value.trim();
    const nomeRegex = /^[a-záàâãéèêíïóôõöúçñA-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s'-]+$/;

    if (nomeLimpo.length < 3) {
      return { nomeMinimo: { min: 3, atual: nomeLimpo.length } };
    }

    if (nomeLimpo.length > 150) {
      return { nomeMaximo: { max: 150, atual: nomeLimpo.length } };
    }

    if (!nomeRegex.test(nomeLimpo)) {
      return { nomeInvalido: { valor: control.value } };
    }

    return null;
  };
}

/**
 * Validador de Título
 */
export function tituloValidator(minimo: number = 5, maximo: number = 250): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const tituloLimpo = control.value.trim();

    if (tituloLimpo.length < minimo) {
      return { tituloMinimo: { min: minimo, atual: tituloLimpo.length } };
    }

    if (tituloLimpo.length > maximo) {
      return { tituloMaximo: { max: maximo, atual: tituloLimpo.length } };
    }

    return null;
  };
}

/**
 * Validador de Conteúdo
 */
export function conteudoValidator(minimo: number = 10, maximo: number = 5000): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const conteudoLimpo = control.value.trim();

    if (conteudoLimpo.length < minimo) {
      return { conteudoMinimo: { min: minimo, atual: conteudoLimpo.length } };
    }

    if (conteudoLimpo.length > maximo) {
      return { conteudoMaximo: { max: maximo, atual: conteudoLimpo.length } };
    }

    return null;
  };
}

/**
 * Validador de Idade
 */
export function idadeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const idade = Number(control.value);

    if (isNaN(idade)) {
      return { idadeNumerica: true };
    }

    if (idade < 13) {
      return { idadeMinima: { min: 13, atual: idade } };
    }

    if (idade > 120) {
      return { idadeMaxima: { max: 120, atual: idade } };
    }

    return null;
  };
}

/**
 * Validador de URL
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    try {
      new URL(control.value);
      return null;
    } catch (err) {
      return { urlInvalida: { valor: control.value } };
    }
  };
}

/**
 * Validador que não permite números
 */
export function semNumerosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    if (/\d/.test(control.value)) {
      return { contemNumeros: true };
    }

    return null;
  };
}

/**
 * Validador que permite apenas números
 */
export function apenasNumerosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    if (!/^\d+$/.test(control.value)) {
      return { apenasNumeros: true };
    }

    return null;
  };
}

/**
 * Validador de força de senha (opcional, para feedback visual)
 * Retorna: 'fraca', 'media', 'forte', null
 */
export function forcaSenhaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const senha = control.value;
    let forca = 0;

    if (senha.length >= 8) forca++;
    if (senha.length >= 12) forca++;
    if (/[a-z]/.test(senha)) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha)) forca++;

    if (forca <= 2) {
      return { forcaSenhaFraca: { forca } };
    }

    if (forca <= 4) {
      // Senha média - não retorna erro, apenas informativo
      return null;
    }

    return null;
  };
}

/**
 * Validador Customizado Assíncrono para verificar email único
 * Uso: form.get('email').setAsyncValidators(emailUnicoValidator(emailService))
 */
export function emailUnicoValidator(emailService: any): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return Promise.resolve(null);
    }

    return emailService.verificarEmailExistente(control.value).then((existe: boolean) => {
      return existe ? { emailEmUso: true } : null;
    });
  };
}

/**
 * Validador Customizado Assíncrono para verificar username único
 */
export function usernameUnicoValidator(userService: any): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return Promise.resolve(null);
    }

    return userService.verificarUsernameExistente(control.value).then((existe: boolean) => {
      return existe ? { usernameEmUso: true } : null;
    });
  };
}
