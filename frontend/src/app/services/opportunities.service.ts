import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Oportunidade } from '../models/opportunity.model';

export interface FiltrosOportunidades {
  interesses: string[];
  estados: string[];
}

export interface PaginacaoOportunidades {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
  ordenar: 'match' | 'recentes';
}

export interface ListaOportunidades {
  data: Oportunidade[];
  pagination: PaginacaoOportunidades;
}

@Injectable({ providedIn: 'root' })
export class OpportunitiesService {
  private api = inject(ApiService);

  listar(filtros: {
    tipo?: string;
    interesse?: string;
    estado?: string;
    busca?: string;
    pagina?: number;
    limite?: number;
    ordenar?: 'match' | 'recentes';
  } = {}) {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Record<string, string | number>;
    return this.api.get<ListaOportunidades>('/opportunities', params);
  }

  listarFiltros() {
    return this.api.get<FiltrosOportunidades>('/opportunities/filtros');
  }

  buscarPorId(id: number) {
    return this.api.get<Oportunidade>(`/opportunities/${id}`);
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
