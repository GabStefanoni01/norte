import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { OpportunitiesService, FiltrosOportunidade } from '../../services/opportunities.service';
import { LocationsService } from '../../services/locations.service';
import { Oportunidade, TIPOS_OPORTUNIDADE } from '../../models/opportunity.model';
import { INTERESSES_DISPONIVEIS } from '../../models/profile.model';
import { Estado } from '../../models/location.model';

@Component({
  selector: 'norte-opportunities',
  standalone: true,
  imports: [NavbarComponent, FormsModule],
  templateUrl: './opportunities.component.html',
})
export class OpportunitiesComponent implements OnInit {
  private opportunitiesService = inject(OpportunitiesService);
  private locations = inject(LocationsService);

  tipos = TIPOS_OPORTUNIDADE;
  interesses = INTERESSES_DISPONIVEIS;
  estados = signal<Estado[]>([]);

  carregando = signal(true);
  erro = signal<string | null>(null);
  oportunidades = signal<Oportunidade[]>([]);

  filtros: FiltrosOportunidade = { tipo: '', interesse: '', estado: '' };

  ngOnInit() {
    this.locations.getEstados().subscribe((estados) => this.estados.set(estados));
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.erro.set(null);

    this.opportunitiesService.listar(this.filtros).subscribe({
      next: (oportunidades) => {
        this.oportunidades.set(oportunidades);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as oportunidades.');
        this.carregando.set(false);
      },
    });
  }

  limparFiltros() {
    this.filtros = { tipo: '', interesse: '', estado: '' };
    this.carregar();
  }

  iconeTipo(tipo: string): string {
    return this.tipos.find((t) => t.valor === tipo)?.icone ?? '📌';
  }
}
