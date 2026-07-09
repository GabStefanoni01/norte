import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { DadosPessoais } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = inject(ApiService);

  buscar(userId: number) {
    return this.api.get<DadosPessoais>(`/users/${userId}`);
  }

  atualizar(userId: number, dados: { nome?: string; cidade?: string; estado?: string; dataNascimento?: string }) {
    return this.api.patch<DadosPessoais>(`/users/${userId}`, dados);
  }
}
