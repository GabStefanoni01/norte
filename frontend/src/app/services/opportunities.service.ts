import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Oportunidade } from '../models/opportunity.model';

export interface FiltrosOportunidade {
  tipo?: string;
  interesse?: string;
  estado?: string;
  gratuito?: string;
}

@Injectable({ providedIn: 'root' })
export class OpportunitiesService {
  private api = inject(ApiService);

  listar(filtros: FiltrosOportunidade = {}) {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>;
    return this.api.get<Oportunidade[]>('/opportunities', params);
  }

  criar(dados: Partial<Oportunidade> & { titulo: string; link: string }) {
    return this.api.post<Oportunidade>('/opportunities', dados);
  }

  remover(id: number) {
    return this.api.delete<void>(`/opportunities/${id}`);
  }
}
