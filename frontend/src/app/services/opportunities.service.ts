import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Oportunidade } from '../models/opportunity.model';

@Injectable({ providedIn: 'root' })
export class OpportunitiesService {
  private api = inject(ApiService);

  listar(filtros: { tipo?: string; interesse?: string; estado?: string; busca?: string } = {}) {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>;
    return this.api.get<Oportunidade[]>('/opportunities', params);
  }

  listarSalvas() {
    return this.api.get<Oportunidade[]>('/opportunities/salvas');
  }

  salvar(id: number) {
    return this.api.post<{ id: number; opportunity_id: number; created_at: string }>(`/opportunities/${id}/salva`, {});
  }

  removerSalva(id: number) {
    return this.api.delete<void>(`/opportunities/${id}/salva`);
  }

  fecharLacuna(id: number) {
    return this.api.post<{ message: string; itensAdicionados: number }>(`/opportunities/${id}/fechar-lacuna`, {});
  }
}
