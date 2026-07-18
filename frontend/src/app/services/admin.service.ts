import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { UsuarioAdmin } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = inject(ApiService);

  listarUsuarios() {
    return this.api.get<UsuarioAdmin[]>('/admin/users');
  }

  atualizarRole(userId: number, role: 'usuario' | 'admin') {
    return this.api.patch<UsuarioAdmin>(`/admin/users/${userId}/role`, { role });
  }

  reenviarTermos(userId: number) {
    return this.api.post<{ message: string }>(`/admin/politica/reenviar/${userId}`, {});
  }
}
