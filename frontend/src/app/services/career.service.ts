import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CareerOption } from '../models/career.model';

@Injectable({ providedIn: 'root' })
export class CareerService {
  private api = inject(ApiService);

  listar() {
    return this.api.get<CareerOption[]>('/career');
  }

  buscarPorId(id: string) {
    return this.api.get<CareerOption>(`/career/${id}`);
  }
}
