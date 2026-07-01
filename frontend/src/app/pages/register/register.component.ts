import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'norte-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  erro = signal<string | null>(null);
  carregando = signal(false);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    idade: [null as number | null],
    cidade: [''],
  });

  criarConta() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.carregando.set(true);

    const dados = this.form.getRawValue();

    this.auth
      .registrar({
        nome: dados.nome!,
        email: dados.email!,
        senha: dados.senha!,
        idade: dados.idade ?? undefined,
        cidade: dados.cidade ?? undefined,
      })
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.router.navigate(['/']);
        },
        error: () => {
          this.carregando.set(false);
          this.erro.set('Não foi possível criar sua conta. Verifique os dados e tente novamente.');
        },
      });
  }
}
