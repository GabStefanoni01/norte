import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';

@Component({
  selector: 'norte-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StarfieldComponent, LogoMarkComponent],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  erro = signal<string | null>(null);
  carregando = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.carregando.set(true);

    const email = this.form.value.email!;

    this.auth.esqueciSenha(email).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/redefinir-senha'], { queryParams: { email } });
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível processar sua solicitação. Tente novamente.');
      },
    });
  }
}
