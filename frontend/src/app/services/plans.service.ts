import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Plano, StatusItem } from '../models/plan.model';

@Injectable({ providedIn: 'root' })
export class PlansService {
  private api = inject(ApiService);

  buscarAtual() {
    // 404 (ainda não gerou plano) não deve quebrar quem chama — retorna null.
    return this.api.get<Plano>('/plans/me').pipe(catchError(() => of(null)));
  }

  gerar() {
    return this.api.post<Plano>('/plans/gerar', {});
  }

  atualizarStatusItem(planId: number, itemId: string, status: StatusItem) {
    return this.api.patch<Plano>(`/plans/${planId}/itens/${itemId}`, { status });
  }
}
