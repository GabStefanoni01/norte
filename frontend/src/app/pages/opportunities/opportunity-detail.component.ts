import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { OpportunitiesService } from '../../services/opportunities.service';
import { Oportunidade } from '../../models/opportunity.model';

@Component({
  selector: 'norte-opportunity-detail',
  standalone: true,
  imports: [SidebarComponent, RouterLink],
  templateUrl: './opportunity-detail.component.html',
})
export class OpportunityDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private opportunitiesService = inject(OpportunitiesService);

  carregando = signal(true);
  erro = signal<string | null>(null);
  oportunidade = signal<Oportunidade | null>(null);
  salva = signal(false);
  salvando = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.erro.set('Oportunidade inválida.');
      this.carregando.set(false);
      return;
    }

    this.opportunitiesService.buscarPorId(id).subscribe({
      next: (op) => {
        this.oportunidade.set(op);
        this.carregando.set(false);
        this.opportunitiesService.listarSalvas().subscribe({
          next: (salvas) => this.salva.set(salvas.some((item) => item.id === op.id)),
          error: () => undefined,
        });
      },
      error: (err) => {
        this.erro.set(err?.error?.error ?? 'Não foi possível carregar esta oportunidade.');
        this.carregando.set(false);
      },
    });
  }

  alternarSalva() {
    const op = this.oportunidade();
    if (!op || this.salvando()) return;

    this.salvando.set(true);
    if (this.salva()) {
      this.opportunitiesService.removerSalva(op.id).subscribe({
        next: () => { this.salva.set(false); this.salvando.set(false); },
        error: () => this.salvando.set(false),
      });
      return;
    }

    this.opportunitiesService.salvar(op.id).subscribe({
      next: () => { this.salva.set(true); this.salvando.set(false); },
      error: () => this.salvando.set(false),
    });
  }

  corMatch(percent: number) {
    if (percent >= 80) return 'text-emerald-400';
    if (percent >= 50) return 'text-norte-accent-light';
    return 'text-white/50';
  }
}
