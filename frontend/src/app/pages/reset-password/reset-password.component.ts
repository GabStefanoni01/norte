import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';
import { senhasIguaisValidator } from '../../validators/senhas-iguais.validator';

@Component({
  selector: 'norte-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StarfieldComponent, LogoMarkComponent],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  erro = signal<string | null>(null);
  carregando = signal(false);

  form = this.fb.group(
    {
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguaisValidator('novaSenha', 'confirmarSenha') }
  );

  ngOnInit() {
    this.email.set(this.route.snapshot.queryParamMap.get('email') ?? '');
  }

  redefinir() {
    if (this.form.invalid || !this.email()) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.carregando.set(true);

    const { codigo, novaSenha } = this.form.getRawValue();

    this.auth.redefinirSenha(this.email(), codigo!, novaSenha!).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/entrar'], { queryParams: { senhaRedefinida: '1' } });
      },
      error: (err) => {
        this.carregando.set(false);
        this.erro.set(err?.error?.error ?? 'Código inválido ou expirado.');
      },
    });
  }
}
