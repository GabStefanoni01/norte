import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { UsuarioAdmin } from '../models/admin-user.model';

export interface EmailStatus {
  configurado: boolean;
  status: 'ok' | 'error' | 'unavailable' | string;
  mensagem: string;
  hostConfigurado: boolean;
  autenticacaoConfigurada: boolean;
  remetente: string;
  porta: number;
}

export interface EmailCampaignResult {
  campanha: string;
  elegiveis: number;
  enviados: number;
  ignorados: number;
  falhas: number;
  erros?: Array<{ userId: number; mensagem: string }>;
}


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

  statusEmail() {
    return this.api.get<EmailStatus>('/admin/emails/status');
  }

  enviarCampanha(tipo: 'progresso' | 'renovacao' | 'inativos' | 'oportunidades' | 'jornada' | 'retorno') {
    return this.api.post<EmailCampaignResult>(`/admin/emails/campanhas/${tipo}`, {});
  }
}
