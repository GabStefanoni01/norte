import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { StatusAssinatura } from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private api = inject(ApiService);

  status() {
    return this.api.get<StatusAssinatura>('/billing/status');
  }
  assinar() {
    return this.api.post<{ initPoint: string }>('/billing/assinar', {});
  }
  cancelar() {
    return this.api.post<{ message: string }>('/billing/cancelar', {});
  }
}
