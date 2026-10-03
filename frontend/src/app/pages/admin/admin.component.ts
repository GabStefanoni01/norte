import { Component, OnInit, signal, inject, computed, DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AdminService } from '../../services/admin.service';
import {
  SystemHealthService,
  HealthResponse,
  ReadyResponse,
  ObservabilityResponse,
} from '../../services/system-health.service';
import { UsuarioAdmin } from '../../models/admin-user.model';

@Component({
  selector: 'norte-admin',
  standalone: true,
  imports: [SidebarComponent, DecimalPipe],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private systemHealth = inject(SystemHealthService);
  private destroyRef = inject(DestroyRef);

  usuarios = signal<UsuarioAdmin[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  atualizandoId = signal<number | null>(null);
  reenviandoId = signal<number | null>(null);
  mensagemReenvio = signal<string | null>(null);
  campanhaEnviando = signal<string | null>(null);
  mensagemCampanha = signal<string | null>(null);
  statusEmail = signal<import('../../services/admin.service').EmailStatus | null>(null);

  health = signal<HealthResponse | null>(null);
  ready = signal<ReadyResponse | null>(null);
  observabilidade = signal<ObservabilityResponse | null>(null);
  carregandoSaude = signal(true);
  erroSaude = signal<string | null>(null);

  totalUsuarios = computed(() => this.usuarios().length);
  usuariosVerificados = computed(
    () => this.usuarios().filter((usuario) => usuario.email_verificado).length
  );
  administradores = computed(
    () => this.usuarios().filter((usuario) => usuario.role === 'admin').length
  );

  taxaErros = computed(() => {
    const metrics = this.observabilidade()?.requests;
    if (!metrics || metrics.totalRequests === 0) return 0;
    return Number(((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(2));
  });

  statusCodes = computed(() => {
    const statusCodes = this.observabilidade()?.requests.statusCodes || {};
    return Object.entries(statusCodes).sort(([a], [b]) => Number(a) - Number(b));
  });

  ngOnInit() {
    this.carregarUsuarios();
    this.carregarSaude();
    this.carregarStatusEmail();

    interval(10000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregarSaude(false));
  }

  carregarStatusEmail() {
    this.admin.statusEmail().subscribe({
      next: (status) => this.statusEmail.set(status),
      error: () => this.statusEmail.set(null),
    });
  }

  carregarUsuarios() {
    this.carregando.set(true);
    this.admin.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os usuários.');
        this.carregando.set(false);
      },
    });
  }

  carregarSaude(exibirLoading = true) {
    if (exibirLoading) this.carregandoSaude.set(true);
    this.erroSaude.set(null);

    let concluido = 0;
    const finalizar = () => {
      concluido += 1;
      if (concluido === 3) this.carregandoSaude.set(false);
    };

    this.systemHealth.health().subscribe({
      next: (response) => {
        this.health.set(response);
        finalizar();
      },
      error: () => {
        this.health.set(null);
        this.erroSaude.set('Não foi possível consultar o health check.');
        finalizar();
      },
    });

    this.systemHealth.ready().subscribe({
      next: (response) => {
        this.ready.set(response);
        finalizar();
      },
      error: () => {
        this.ready.set(null);
        this.erroSaude.set('Não foi possível consultar o readiness check.');
        finalizar();
      },
    });

    this.systemHealth.observabilidade().subscribe({
      next: (response) => {
        this.observabilidade.set(response);
        finalizar();
      },
      error: () => {
        this.observabilidade.set(null);
        this.erroSaude.set('Não foi possível consultar as métricas de observabilidade.');
        finalizar();
      },
    });
  }

  megabytes(bytes: number | undefined) {
    if (bytes === undefined) return 0;
    return Number((bytes / 1024 / 1024).toFixed(2));
  }

  formatarUptime(seconds: number | undefined) {
    if (seconds === undefined) return '—';

    const dias = Math.floor(seconds / 86400);
    const horas = Math.floor((seconds % 86400) / 3600);
    const minutos = Math.floor((seconds % 3600) / 60);

    if (dias > 0) return `${dias}d ${horas}h ${minutos}min`;
    if (horas > 0) return `${horas}h ${minutos}min`;
    return `${minutos}min`;
  }

  statusColetor(status: string | undefined) {
    return {
      idle: 'Aguardando',
      running: 'Executando',
      success: 'Sucesso',
      failed: 'Falhou',
    }[status || ''] || 'Desconhecido';
  }

  alternarRole(usuario: UsuarioAdmin) {
    const novaRole = usuario.role === 'admin' ? 'usuario' : 'admin';
    this.atualizandoId.set(usuario.id);

    this.admin.atualizarRole(usuario.id, novaRole).subscribe({
      next: (atualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === atualizado.id ? { ...u, role: atualizado.role } : u))
        );
        this.atualizandoId.set(null);
      },
      error: () => {
        this.erro.set('Não foi possível atualizar o papel deste usuário.');
        this.atualizandoId.set(null);
      },
    });
  }

  dispararCampanha(tipo: 'progresso' | 'renovacao' | 'inativos' | 'oportunidades' | 'jornada' | 'retorno', nome: string) {
    this.campanhaEnviando.set(tipo);
    this.mensagemCampanha.set(null);

    this.admin.enviarCampanha(tipo).subscribe({
      next: (resultado) => {
        this.mensagemCampanha.set(
          nome + ': ' + resultado.enviados + ' enviados, ' +
          resultado.ignorados + ' ignorados por intervalo e ' +
          resultado.falhas + ' falhas.'
        );
        this.campanhaEnviando.set(null);
      },
      error: (err) => {
        const mensagem = err?.error?.error || 'Não foi possível executar a campanha.';
        this.mensagemCampanha.set(mensagem);
        this.campanhaEnviando.set(null);
      },
    });
  }

  reenviarTermos(usuario: UsuarioAdmin) {
    this.reenviandoId.set(usuario.id);
    this.mensagemReenvio.set(null);

    this.admin.reenviarTermos(usuario.id).subscribe({
      next: (res) => {
        this.mensagemReenvio.set(res.message);
        this.reenviandoId.set(null);
      },
      error: () => {
        this.erro.set('Não foi possível reenviar o e-mail de aceite.');
        this.reenviandoId.set(null);
      },
    });
  }
}
