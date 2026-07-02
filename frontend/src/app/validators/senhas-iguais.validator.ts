import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador de grupo: garante que os campos `senha` e `confirmarSenha`
 * (ou os nomes informados) tenham o mesmo valor.
 */
export function senhasIguaisValidator(
  senhaControl = 'senha',
  confirmarControl = 'confirmarSenha'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const senha = group.get(senhaControl)?.value;
    const confirmar = group.get(confirmarControl)?.value;

    if (!senha || !confirmar) return null;

    return senha === confirmar ? null : { senhasDiferentes: true };
  };
}
