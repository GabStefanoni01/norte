import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AdminService } from '../../services/admin.service';
import { SystemHealthService, HealthResponse, ReadyResponse } from '../../services/system-health.service';
import { UsuarioAdmin } from '../../models/admin-user.model';

@Component({
  selector: 'norte-admin',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private systemHealth = inject(SystemHealthService);

  usuarios = signal<UsuarioAdmin[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  atualizandoId = signal<number | null>(null);
  reenviandoId = signal<number | null>(null);
  mensagemReenvio = signal<string | null>(null);

  health = signal<HealthResponse | null>(null);
  ready = signal<ReadyResponse | null>(null);
  carregandoSaude = signal(true);
  erroSaude = signal<string | null>(null);

  totalUsuarios = computed(() => this.usuarios().length);
  usuariosVerificados = computed(
    () => this.usuarios().filter((usuario) => usuario.email_verificado).length
  );
  administradores = computed(
    () => this.usuarios().filter((usuario) => usuario.role === 'admin').length
  );

  ngOnInit() {
    this.carregarUsuarios();
    this.carregarSaude();
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

  carregarSaude() {
    this.carregandoSaude.set(true);
    this.erroSaude.set(null);

    let concluido = 0;
    const finalizar = () => {
      concluido += 1;
      if (concluido === 2) this.carregandoSaude.set(false);
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
