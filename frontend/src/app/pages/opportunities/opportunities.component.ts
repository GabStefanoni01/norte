import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { OpportunitiesService } from '../../services/opportunities.service';
import { Oportunidade, TIPOS_OPORTUNIDADE } from '../../models/opportunity.model';

@Component({
  selector: 'norte-opportunities',
  standalone: true,
  imports: [SidebarComponent, FormsModule],
  templateUrl: './opportunities.component.html',
})
export class OpportunitiesComponent implements OnInit {
  private opportunitiesService = inject(OpportunitiesService);

  tipos = TIPOS_OPORTUNIDADE;
  carregando = signal(true);
  erro = signal<string | null>(null);
  oportunidades = signal<Oportunidade[]>([]);
  fechandoLacunaId = signal<number | null>(null);
  mensagemLacuna = signal<string | null>(null);

  filtroTipo = '';

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.opportunitiesService.listar({ tipo: this.filtroTipo }).subscribe({
      next: (ops) => { this.oportunidades.set(ops); this.carregando.set(false); },
      error: () => { this.erro.set('Não foi possível carregar as oportunidades.'); this.carregando.set(false); },
    });
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
