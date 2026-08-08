import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ProfileService } from '../../services/profile.service';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations.service';
import { INTERESSES_DISPONIVEIS, ESCOLARIDADES } from '../../models/profile.model';
import { Estado, Cidade } from '../../models/location.model';
import { senhasIguaisValidator } from '../../validators/senhas-iguais.validator';
import { BillingService } from '../../services/billing.service';
import { StatusAssinatura } from '../../models/billing.model';

type Aba = 'profissional' | 'pessoal' | 'seguranca' | 'assinatura';

@Component({
  selector: 'norte-profile',
  standalone: true,
  imports: [ReactiveFormsModule, SidebarComponent, DatePipe],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private usersService = inject(UsersService);
  private locations = inject(LocationsService);
  private router = inject(Router);

  auth = inject(AuthService);
  private billing = inject(BillingService);
  hoje = new Date().toISOString().slice(0, 10);

  abaAtiva = signal<Aba>('profissional');
  interessesDisponiveis = INTERESSES_DISPONIVEIS;
  escolaridades = ESCOLARIDADES;

  // --- Perfil profissional ---
  carregando = signal(true);
  salvando = signal(false);
  sucesso = signal<string | null>(null);
  erro = signal<string | null>(null);
  jaTemPerfil = signal(false);

  form = this.fb.group({
    escolaridade: ['', [Validators.required]],
    interesses: this.fb.array(this.interessesDisponiveis.map(() => this.fb.control(false))),
    objetivos: ['', [Validators.required, Validators.minLength(5)]],
    habilidadesTexto: [''],
    carreiraInteresse: [''],
  });

  // --- Dados pessoais ---
  carregandoDados = signal(true);
  salvandoDados = signal(false);
  sucessoDados = signal<string | null>(null);
  erroDados = signal<string | null>(null);
  estados = signal<Estado[]>([]);
  cidades = signal<Cidade[]>([]);
  carregandoCidades = signal(false);

  formDados = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    dataNascimento: ['', [Validators.required]],
    estado: ['', [Validators.required]],
    cidade: [{ value: '', disabled: true }, [Validators.required]],
  });

  // --- Segurança (troca de senha) ---
  etapaSenha = signal<'inicial' | 'aguardandoCodigo'>('inicial');
  enviandoCodigoSenha = signal(false);
  confirmandoSenha = signal(false);
  erroSenha = signal<string | null>(null);
  sucessoSenha = signal<string | null>(null);

  formSenha = this.fb.group(
    {
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguaisValidator('novaSenha', 'confirmarSenha') }
  );

  // --- Assinatura ---
  statusAssinatura = signal<StatusAssinatura | null>(null);
  carregandoAssinatura = signal(true);
  processandoAssinatura = signal(false);
  erroAssinatura = signal<string | null>(null);

  ngOnInit() {
    this.carregarPerfilProfissional();
    this.carregarDadosPessoais();
    this.carregarAssinatura();
  }

  private carregarAssinatura() {
    this.billing.status().subscribe({
      next: (s) => { this.statusAssinatura.set(s); this.carregandoAssinatura.set(false); },
      error: () => this.carregandoAssinatura.set(false),
    });
  }

  assinarPremium() {
    this.erroAssinatura.set(null);
    this.processandoAssinatura.set(true);
    this.billing.assinar().subscribe({
      next: (res) => { window.location.href = res.initPoint; },
      error: (err) => {
        this.processandoAssinatura.set(false);
        this.erroAssinatura.set(err?.error?.error ?? 'Não foi possível iniciar a assinatura.');
      },
    });
  }

  cancelarPremium() {
    this.processandoAssinatura.set(true);
    this.billing.cancelar().subscribe({
      next: () => { this.processandoAssinatura.set(false); this.carregarAssinatura(); },
      error: () => {
        this.processandoAssinatura.set(false);
        this.erroAssinatura.set('Não foi possível cancelar a assinatura.');
      },
    });
  }

  mudarAba(aba: Aba) {
    this.abaAtiva.set(aba);
  }

  // ===== Perfil profissional =====

  private carregarPerfilProfissional() {
    this.profileService.buscar().subscribe((perfil) => {
      if (perfil) {
        this.jaTemPerfil.set(true);
        this.form.patchValue({
          escolaridade: perfil.escolaridade,
          objetivos: perfil.objetivos,
          habilidadesTexto: (perfil.habilidades || []).join(', '),
          carreiraInteresse: perfil.carreira_interesse || '',
        });

        const interesses = perfil.interesses || [];
        this.interessesDisponiveis.forEach((interesse, i) => {
          if (interesses.includes(interesse)) {
            this.interessesArray.at(i).setValue(true);
          }
        });
      }
      this.carregando.set(false);
    });
  }

  get interessesArray() {
    return this.form.get('interesses') as FormArray;
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.sucesso.set(null);
    this.salvando.set(true);

    const valores = this.form.getRawValue();
    const interesses = this.interessesDisponiveis.filter((_, i) => valores.interesses[i]);
    const habilidades = (valores.habilidadesTexto || '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    this.profileService
      .salvar({
        escolaridade: valores.escolaridade!,
        interesses,
        objetivos: valores.objetivos!,
        habilidades,
        carreira_interesse: valores.carreiraInteresse || undefined,
      })
      .subscribe({
        next: () => {
          this.salvando.set(false);
          if (this.jaTemPerfil()) {
            this.sucesso.set('Perfil atualizado com sucesso.');
          } else {
            this.router.navigate(['/descoberta']);
          }
        },
        error: () => {
          this.salvando.set(false);
          this.erro.set('Não foi possível salvar seu perfil. Tente novamente.');
        },
      });
  }

  // ===== Dados pessoais =====

  private cidadeAlvo: string | null = null;

  private carregarDadosPessoais() {
    const userId = this.auth.usuarioAtual()?.id;
    if (!userId) {
      this.carregandoDados.set(false);
      return;
    }

    this.locations.getEstados().subscribe((estados) => this.estados.set(estados));

    // Assina antes de popular o formulário, pra garantir que a troca de
    // estado (inclusive a que vem dos dados carregados) sempre dispare a
    // busca de cidades uma única vez, sem corrida com fetches manuais.
    this.formDados.get('estado')!.valueChanges.subscribe((uf) => this.aoTrocarEstado(uf));

    this.usersService.buscar(userId).subscribe({
      next: (dados) => {
        this.cidadeAlvo = dados.cidade;
        this.formDados.patchValue({
          nome: dados.nome,
          dataNascimento: dados.data_nascimento ? dados.data_nascimento.slice(0, 10) : '',
          estado: dados.estado || '',
        });
        this.carregandoDados.set(false);
      },
      error: () => {
        this.erroDados.set('Não foi possível carregar seus dados.');
        this.carregandoDados.set(false);
      },
    });
  }

  private aoTrocarEstado(uf: string | null) {
    const cidadeControl = this.formDados.get('cidade')!;
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

        // Se essa troca de estado veio do carregamento inicial, seleciona
        // a cidade que a pessoa já tinha salva assim que a lista chega.
        if (this.cidadeAlvo) {
          cidadeControl.setValue(this.cidadeAlvo);
          this.cidadeAlvo = null;
        }
      },
      error: () => {
        this.carregandoCidades.set(false);
      },
    });
  }

  salvarDadosPessoais() {
    if (this.formDados.invalid) {
      this.formDados.markAllAsTouched();
      return;
    }

    const userId = this.auth.usuarioAtual()?.id;
    if (!userId) return;

    this.erroDados.set(null);
    this.sucessoDados.set(null);
    this.salvandoDados.set(true);

    const valores = this.formDados.getRawValue();

    this.usersService
      .atualizar(userId, {
        nome: valores.nome!,
        dataNascimento: valores.dataNascimento!,
        estado: valores.estado!,
        cidade: valores.cidade!,
      })
      .subscribe({
        next: () => {
          this.salvandoDados.set(false);
          this.sucessoDados.set('Dados atualizados com sucesso.');
        },
        error: () => {
          this.salvandoDados.set(false);
          this.erroDados.set('Não foi possível salvar seus dados. Tente novamente.');
        },
      });
  }

  // ===== Segurança (troca de senha) =====

  solicitarCodigoSenha() {
    const email = this.auth.usuarioAtual()?.email;
    if (!email) return;

    this.erroSenha.set(null);
    this.enviandoCodigoSenha.set(true);

    this.auth.esqueciSenha(email).subscribe({
      next: () => {
        this.enviandoCodigoSenha.set(false);
        this.etapaSenha.set('aguardandoCodigo');
      },
      error: () => {
        this.enviandoCodigoSenha.set(false);
        this.erroSenha.set('Não foi possível enviar o código. Tente novamente.');
      },
    });
  }

  confirmarNovaSenha() {
    if (this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }

    const email = this.auth.usuarioAtual()?.email;
    if (!email) return;

    this.erroSenha.set(null);
    this.confirmandoSenha.set(true);

    const { codigo, novaSenha } = this.formSenha.getRawValue();

    this.auth.redefinirSenha(email, codigo!, novaSenha!).subscribe({
      next: () => {
        // Por segurança, força um novo login com a senha nova.
        this.auth.logout();
        this.router.navigate(['/entrar'], { queryParams: { senhaRedefinida: '1' } });
      },
      error: (err) => {
        this.confirmandoSenha.set(false);
        this.erroSenha.set(err?.error?.error ?? 'Código inválido ou expirado.');
      },
    });
  }

  cancelarTrocaSenha() {
    this.etapaSenha.set('inicial');
    this.formSenha.reset();
    this.erroSenha.set(null);
  }
}
