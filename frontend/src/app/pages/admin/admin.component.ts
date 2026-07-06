import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AdminService } from '../../services/admin.service';
import { OpportunitiesService } from '../../services/opportunities.service';
import { LocationsService } from '../../services/locations.service';
import { UsuarioAdmin } from '../../models/admin-user.model';
import { Oportunidade, TIPOS_OPORTUNIDADE } from '../../models/opportunity.model';
import { INTERESSES_DISPONIVEIS } from '../../models/profile.model';
import { Estado } from '../../models/location.model';

type Aba = 'usuarios' | 'oportunidades';

@Component({
  selector: 'norte-admin',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private opportunitiesService = inject(OpportunitiesService);
  private locations = inject(LocationsService);
  private fb = inject(FormBuilder);

  estados = signal<Estado[]>([]);

  abaAtiva = signal<Aba>('usuarios');

  // --- Usuários ---
  usuarios = signal<UsuarioAdmin[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  atualizandoId = signal<number | null>(null);

  // --- Oportunidades ---
  tipos = TIPOS_OPORTUNIDADE;
  interesses = INTERESSES_DISPONIVEIS;
  oportunidades = signal<Oportunidade[]>([]);
  carregandoOportunidades = signal(true);
  salvandoOportunidade = signal(false);
  erroOportunidade = signal<string | null>(null);
  removendoId = signal<number | null>(null);
  atualizandoStatusId = signal<number | null>(null);

  buscandoNaWeb = signal(false);
  resultadoBusca = signal<{ encontradas: number; novas: number; duplicadas: number } | null>(null);
  filtroInteresseBusca = '';
  filtroEstadoBusca = '';

  formOportunidade = this.fb.group({
    titulo: ['', [Validators.required]],
    empresa: [''],
    tipo: ['curso', [Validators.required]],
    interesse: [''],
    descricao: [''],
    link: ['', [Validators.required]],
    gratuito: [true],
  });

  ngOnInit() {
    this.carregarUsuarios();
    this.carregarOportunidades();
    this.locations.getEstados().subscribe((estados) => this.estados.set(estados));
  }

  mudarAba(aba: Aba) {
    this.abaAtiva.set(aba);
  }

  // ===== Usuários =====

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

  // ===== Oportunidades =====

  carregarOportunidades() {
    this.carregandoOportunidades.set(true);
    this.opportunitiesService.listarTodas().subscribe({
      next: (oportunidades) => {
        this.oportunidades.set(oportunidades);
        this.carregandoOportunidades.set(false);
      },
      error: () => {
        this.erroOportunidade.set('Não foi possível carregar as oportunidades.');
        this.carregandoOportunidades.set(false);
      },
    });
  }

  buscarNaWeb() {
    this.erroOportunidade.set(null);
    this.resultadoBusca.set(null);
    this.buscandoNaWeb.set(true);

    this.opportunitiesService
      .buscarNaWeb({
        interesse: this.filtroInteresseBusca || undefined,
        estado: this.filtroEstadoBusca || undefined,
      })
      .subscribe({
        next: (resultado) => {
          this.resultadoBusca.set(resultado);
          this.buscandoNaWeb.set(false);
          this.carregarOportunidades();
        },
        error: (err) => {
          this.buscandoNaWeb.set(false);
          this.erroOportunidade.set(
            err?.error?.error ?? 'Não foi possível buscar na web. Tente novamente.'
          );
        },
      });
  }

  aprovarOportunidade(oportunidade: Oportunidade) {
    this.atualizandoStatusId.set(oportunidade.id);

    this.opportunitiesService.atualizarStatus(oportunidade.id, 'publicada').subscribe({
      next: (atualizada) => {
        this.oportunidades.update((lista) =>
          lista.map((o) => (o.id === atualizada.id ? atualizada : o))
        );
        this.atualizandoStatusId.set(null);
      },
      error: () => {
        this.erroOportunidade.set('Não foi possível aprovar essa oportunidade.');
        this.atualizandoStatusId.set(null);
      },
    });
  }

  criarOportunidade() {
    if (this.formOportunidade.invalid) {
      this.formOportunidade.markAllAsTouched();
      return;
    }

    this.erroOportunidade.set(null);
    this.salvandoOportunidade.set(true);

    const valores = this.formOportunidade.getRawValue();

    this.opportunitiesService
      .criar({
        titulo: valores.titulo!,
        link: valores.link!,
        empresa: valores.empresa || undefined,
        tipo: (valores.tipo as Oportunidade['tipo']) || undefined,
        interesse: valores.interesse || undefined,
        descricao: valores.descricao || undefined,
        gratuito: valores.gratuito ?? true,
      })
      .subscribe({
        next: (nova) => {
          this.oportunidades.update((lista) => [nova, ...lista]);
          this.formOportunidade.reset({ tipo: 'curso', gratuito: true });
          this.salvandoOportunidade.set(false);
        },
        error: () => {
          this.erroOportunidade.set('Não foi possível criar a oportunidade.');
          this.salvandoOportunidade.set(false);
        },
      });
  }

  removerOportunidade(oportunidade: Oportunidade) {
    this.removendoId.set(oportunidade.id);

    this.opportunitiesService.remover(oportunidade.id).subscribe({
      next: () => {
        this.oportunidades.update((lista) => lista.filter((o) => o.id !== oportunidade.id));
        this.removendoId.set(null);
      },
      error: () => {
        this.erroOportunidade.set('Não foi possível remover essa oportunidade.');
        this.removendoId.set(null);
      },
    });
  }
}
