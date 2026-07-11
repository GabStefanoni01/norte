import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';

@Component({
  selector: 'norte-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StarfieldComponent, LogoMarkComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);
  emailNaoVerificado = signal(false);
  carregando = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;

    if (params.get('verificado')) {
      this.sucesso.set('E-mail confirmado! Agora é só entrar.');
    } else if (params.get('senhaRedefinida')) {
      this.sucesso.set('Senha redefinida com sucesso. Entre com sua nova senha.');
    }
  }

  entrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.sucesso.set(null);
    this.emailNaoVerificado.set(false);
    this.carregando.set(true);

    const { email, senha } = this.form.getRawValue();

    this.auth.login(email!, senha!).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.carregando.set(false);

        if (err?.error?.code === 'EMAIL_NAO_VERIFICADO') {
          this.emailNaoVerificado.set(true);
          this.erro.set(err.error.error);
          return;
        }

        this.erro.set('E-mail ou senha incorretos. Tente novamente.');
      },
    });
  }
}
