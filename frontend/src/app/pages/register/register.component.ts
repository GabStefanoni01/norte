import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations.service';
import { Estado, Cidade } from '../../models/location.model';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { senhasIguaisValidator } from '../../validators/senhas-iguais.validator';

@Component({
  selector: 'norte-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StarfieldComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private locations = inject(LocationsService);
  private router = inject(Router);

  erro = signal<string | null>(null);
  carregando = signal(false);
  carregandoCidades = signal(false);
  estados = signal<Estado[]>([]);
  cidades = signal<Cidade[]>([]);

  hoje = new Date().toISOString().slice(0, 10);

  form = this.fb.group(
    {
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
      dataNascimento: ['', [Validators.required]],
      estado: ['', [Validators.required]],
      cidade: [{ value: '', disabled: true }, [Validators.required]],
    },
    { validators: senhasIguaisValidator() }
  );

  ngOnInit() {
    this.locations.getEstados().subscribe({
      next: (estados) => this.estados.set(estados),
      error: () => this.erro.set('Não foi possível carregar a lista de estados.'),
    });

    this.form.get('estado')!.valueChanges.subscribe((uf) => this.aoTrocarEstado(uf));
  }

  private aoTrocarEstado(uf: string | null) {
    const cidadeControl = this.form.get('cidade')!;
    cidadeControl.setValue('');
    this.cidades.set([]);

    if (!uf) {
      cidadeControl.disable();
      return;
    }

    this.carregandoCidades.set(true);
    cidadeControl.disable();

    this.locations.getCidadesPorEstado(uf).subscribe({
      next: (cidades) => {
        this.cidades.set(cidades);
        this.carregandoCidades.set(false);
        cidadeControl.enable();
      },
      error: () => {
        this.carregandoCidades.set(false);
        this.erro.set('Não foi possível carregar as cidades desse estado.');
      },
    });
  }

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
        dataNascimento: dados.dataNascimento!,
        estado: dados.estado!,
        cidade: dados.cidade!,
      })
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.router.navigate(['/verificar-email'], { queryParams: { email: dados.email } });
        },
        error: () => {
          this.carregando.set(false);
          this.erro.set('Não foi possível criar sua conta. Verifique os dados e tente novamente.');
        },
      });
  }
}
