import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PlansService } from '../../services/plans.service';
import { Plano, StatusItem, ItemPlano } from '../../models/plan.model';

const PROXIMO_STATUS: Record<StatusItem, StatusItem> = {
  pendente: 'em_andamento',
  em_andamento: 'concluido',
  concluido: 'pendente',
};

@Component({
  selector: 'norte-plans',
  standalone: true,
  imports: [NavbarComponent, RouterLink],
  templateUrl: './plans.component.html',
})
export class PlansComponent implements OnInit {
  private plansService = inject(PlansService);

  carregando = signal(true);
  gerando = signal(false);
  atualizandoItemId = signal<string | null>(null);
  erro = signal<string | null>(null);
  plano = signal<Plano | null>(null);

  ngOnInit() {
    this.carregarPlano();
  }

  private carregarPlano() {
    this.carregando.set(true);
    this.plansService.buscarAtual().subscribe((plano) => {
      this.plano.set(plano);
      this.carregando.set(false);
    });
  }

  gerarPlano() {
    this.erro.set(null);
    this.gerando.set(true);

    this.plansService.gerar().subscribe({
      next: (plano) => {
        this.gerando.set(false);
        this.plano.set(plano);
      },
      error: () => {
        this.gerando.set(false);
        this.erro.set('Não foi possível gerar seu plano. Tente novamente.');
      },
    });
  }

  avancarStatus(item: ItemPlano) {
    const plano = this.plano();
    if (!plano || this.atualizandoItemId()) return;

    this.atualizandoItemId.set(item.id);
    const novoStatus = PROXIMO_STATUS[item.status];

    this.plansService.atualizarStatusItem(plano.id, item.id, novoStatus).subscribe({
      next: (planoAtualizado) => {
        this.plano.set(planoAtualizado);
        this.atualizandoItemId.set(null);
      },
      error: () => {
        this.atualizandoItemId.set(null);
        this.erro.set('Não foi possível atualizar esse item. Tente novamente.');
      },
    });
  }

  rotuloStatus(status: StatusItem): string {
    return { pendente: 'Pendente', em_andamento: 'Em andamento', concluido: 'Concluído' }[status];
  }
}
