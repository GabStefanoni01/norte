import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Oportunidade } from '../models/opportunity.model';

@Injectable({ providedIn: 'root' })
export class OpportunitiesService {
  private api = inject(ApiService);

  listar(filtros: { tipo?: string; interesse?: string; estado?: string } = {}) {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>;
    return this.api.get<Oportunidade[]>('/opportunities', params);
  }
  fecharLacuna(id: number) {
    return this.api.post<{ message: string; itensAdicionados: number }>(`/opportunities/${id}/fechar-lacuna`, {});
  }
}
