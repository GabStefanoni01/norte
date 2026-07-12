import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private api = inject(ApiService);

  enviar(dados: { nome: string; email: string; mensagem: string }) {
    return this.api.post<{ message: string }>('/contact', dados);
  }
}
