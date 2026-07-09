import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PlansService } from '../../services/plans.service';
import { Plano, StatusItem, ItemPlano } from '../../models/plan.model';

@Component({
  selector: 'norte-plans',
  standalone: true,
  imports: [NavbarComponent, RouterLink, FormsModule],
  templateUrl: './plans.component.html',
})
export class PlansComponent implements OnInit {
  private plansService = inject(PlansService);

  carregando = signal(true);
  gerando = signal(false);
  atualizandoItemId = signal<string | null>(null);
  erro = signal<string | null>(null);
  plano = signal<Plano | null>(null);

  // Mini check-in ao concluir um item
  itemEmCheckin = signal<ItemPlano | null>(null);
  dificuldadeCheckin = 3;
  aprendizadoCheckin = '';

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

  clicarItem(item: ItemPlano) {
    if (this.atualizandoItemId()) return;

    if (item.status === 'concluido') {
      // Desfazer conclusão: volta pro início do ciclo, sem precisar de check-in.
      this.aplicarStatus(item, 'pendente');
      return;
    }

    if (item.status === 'pendente') {
      this.aplicarStatus(item, 'em_andamento');
      return;
    }

    // em_andamento -> abre o mini check-in antes de marcar como concluído.
    this.dificuldadeCheckin = 3;
    this.aprendizadoCheckin = '';
    this.itemEmCheckin.set(item);
  }

  confirmarCheckin() {
    const item = this.itemEmCheckin();
    if (!item) return;

    this.aplicarStatus(item, 'concluido', {
      dificuldade: this.dificuldadeCheckin,
      aprendizado: this.aprendizadoCheckin.trim() || undefined,
    });
    this.itemEmCheckin.set(null);
  }

  cancelarCheckin() {
    this.itemEmCheckin.set(null);
  }

  private aplicarStatus(
    item: ItemPlano,
    status: StatusItem,
    reflexao?: { dificuldade?: number; aprendizado?: string }
  ) {
    const plano = this.plano();
    if (!plano) return;

    this.atualizandoItemId.set(item.id);

    this.plansService.atualizarStatusItem(plano.id, item.id, status, reflexao).subscribe({
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
