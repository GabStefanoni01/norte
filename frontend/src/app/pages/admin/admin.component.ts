import { Component, OnInit, signal, inject } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AdminService } from '../../services/admin.service';
import { UsuarioAdmin } from '../../models/admin-user.model';

@Component({
  selector: 'norte-admin',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);

  usuarios = signal<UsuarioAdmin[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  atualizandoId = signal<number | null>(null);
  reenviandoId = signal<number | null>(null);
  mensagemReenvio = signal<string | null>(null);

  ngOnInit() {
    this.carregarUsuarios();
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
