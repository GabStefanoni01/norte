import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { StarfieldComponent } from '../../components/starfield/starfield.component';

@Component({
  selector: 'norte-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StarfieldComponent],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  erro = signal<string | null>(null);
  sucesso = signal<string | null>(null);
  carregando = signal(false);
  reenviando = signal(false);

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit() {
    this.email.set(this.route.snapshot.queryParamMap.get('email') ?? '');
  }

  confirmar() {
    if (this.form.invalid || !this.email()) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.carregando.set(true);

    this.auth.verificarEmail(this.email(), this.form.value.codigo!).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/entrar'], {
          queryParams: { verificado: '1' },
        });
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.error ?? 'Código inválido ou expirado.');
      },
    });
  }

  reenviarCodigo() {
    if (!this.email()) return;

    this.erro.set(null);
    this.sucesso.set(null);
    this.reenviando.set(true);

    this.auth.reenviarCodigoVerificacao(this.email()).subscribe({
      next: () => {
        this.reenviando.set(false);
        this.sucesso.set('Novo código enviado para o seu e-mail.');
      },
      error: (err) => {
        this.reenviando.set(false);
        this.erro.set(err?.error?.error ?? 'Não foi possível reenviar o código.');
      },
    });
  }
}
