import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { OpportunitiesService } from '../../services/opportunities.service';
import { Oportunidade, TIPOS_OPORTUNIDADE } from '../../models/opportunity.model';

@Component({
  selector: 'norte-opportunities',
  standalone: true,
  imports: [SidebarComponent, FormsModule, RouterLink],
  templateUrl: './opportunities.component.html',
})
export class OpportunitiesComponent implements OnInit {
  private opportunitiesService = inject(OpportunitiesService);

  tipos = TIPOS_OPORTUNIDADE;
  carregando = signal(true);
  erro = signal<string | null>(null);
  oportunidades = signal<Oportunidade[]>([]);
  salvas = signal<Set<number>>(new Set());
  mostrandoSalvas = signal(false);
  salvandoId = signal<number | null>(null);
  fechandoLacunaId = signal<number | null>(null);
  mensagemLacuna = signal<string | null>(null);
  filtrosCarregados = signal(false);
  total = signal(0);
  totalPaginas = signal(1);
  paginaAtual = signal(1);

  interesses = signal<string[]>([]);
  estados = signal<string[]>([]);
  filtroTipo = '';
  filtroInteresse = '';
  filtroEstado = '';
  busca = '';
  ordenacao: 'match' | 'recentes' = 'match';

  ngOnInit() {
    this.carregarFiltros();
    this.carregar();
  }

  carregarFiltros() {
    this.opportunitiesService.listarFiltros().subscribe({
      next: (filtros) => {
        this.interesses.set(filtros.interesses);
        this.estados.set(filtros.estados);
        this.filtrosCarregados.set(true);
      },
      error: () => this.filtrosCarregados.set(true),
    });
  }

  carregar() {
    this.carregando.set(true);
    this.erro.set(null);
    this.mensagemLacuna.set(null);

    if (this.mostrandoSalvas()) {
      this.opportunitiesService.listarSalvas().subscribe({
        next: (ops) => {
          this.oportunidades.set(ops);
          this.salvas.set(new Set(ops.map((op) => op.id)));
          this.total.set(ops.length);
          this.totalPaginas.set(1);
          this.paginaAtual.set(1);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar suas oportunidades salvas.');
          this.carregando.set(false);
        },
      });
      return;
    }

    this.opportunitiesService.listar({
      tipo: this.filtroTipo,
      interesse: this.filtroInteresse,
      estado: this.filtroEstado,
      busca: this.busca.trim(),
      pagina: this.paginaAtual(),
      limite: 12,
      ordenar: this.ordenacao,
    }).subscribe({
      next: (res) => {
        this.oportunidades.set(res.data);
        this.total.set(res.pagination.total);
        this.totalPaginas.set(res.pagination.totalPaginas);
        this.paginaAtual.set(res.pagination.pagina);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as oportunidades.');
        this.carregando.set(false);
      },
    });

    this.opportunitiesService.listarSalvas().subscribe({
      next: (ops) => this.salvas.set(new Set(ops.map((op) => op.id))),
      error: () => undefined,
    });
  }

  pesquisar() {
    if (this.mostrandoSalvas()) this.mostrandoSalvas.set(false);
    this.paginaAtual.set(1);
    this.carregar();
  }

  mudarOrdenacao() {
    this.paginaAtual.set(1);
    this.carregar();
  }

  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas() || pagina === this.paginaAtual()) return;
    this.paginaAtual.set(pagina);
    this.carregar();
  }

  paginaAnterior() {
    this.irParaPagina(this.paginaAtual() - 1);
  }

  proximaPagina() {
    this.irParaPagina(this.paginaAtual() + 1);
  }

  paginasVisiveis() {
    const total = this.totalPaginas();
    const atual = this.paginaAtual();
    const inicio = Math.max(1, Math.min(atual - 2, total - 4));
    const fim = Math.min(total, inicio + 4);
    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  }

  limparFiltros() {
    this.filtroTipo = '';
    this.filtroInteresse = '';
    this.filtroEstado = '';
    this.busca = '';
    this.paginaAtual.set(1);
    this.carregar();
  }

  limparBusca() {
    this.busca = '';
    this.paginaAtual.set(1);
    this.carregar();
  }

  alternarSalvas() {
    this.mostrandoSalvas.set(!this.mostrandoSalvas());
    if (this.mostrandoSalvas()) {
      this.filtroTipo = '';
      this.filtroInteresse = '';
      this.filtroEstado = '';
      this.busca = '';
    }
    this.paginaAtual.set(1);
    this.carregar();
  }

  estaSalva(id: number) { return this.salvas().has(id); }

  alternarSalva(op: Oportunidade) {
    if (this.salvandoId() === op.id) return;
    this.salvandoId.set(op.id);

    if (this.estaSalva(op.id)) {
      this.opportunitiesService.removerSalva(op.id).subscribe({
        next: () => this.finalizarSalva(op.id, true),
        error: () => this.salvandoId.set(null),
      });
      return;
    }

    this.opportunitiesService.salvar(op.id).subscribe({
      next: () => this.finalizarSalva(op.id, false),
      error: () => this.salvandoId.set(null),
    });
  }

  private finalizarSalva(id: number, removida: boolean) {
    const novasSalvas = new Set(this.salvas());
    if (removida) {
      novasSalvas.delete(id);
      if (this.mostrandoSalvas()) this.oportunidades.set(this.oportunidades().filter((item) => item.id !== id));
    } else {
      novasSalvas.add(id);
    }
    this.salvas.set(novasSalvas);
    this.salvandoId.set(null);
  }

  fecharLacuna(op: Oportunidade) {
    this.fechandoLacunaId.set(op.id);
    this.mensagemLacuna.set(null);
    this.opportunitiesService.fecharLacuna(op.id).subscribe({
      next: (res) => { this.mensagemLacuna.set(res.message); this.fechandoLacunaId.set(null); },
      error: (err) => {
        this.mensagemLacuna.set(err?.error?.error ?? 'Não foi possível gerar o plano.');
        this.fechandoLacunaId.set(null);
      },
    });
  }

  corMatch(percent: number) {
    if (percent >= 80) return 'text-emerald-400';
    if (percent >= 50) return 'text-norte-accent-light';
    return 'text-white/50';
  }
}
