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


export interface InstitutionInterestRequest {
  id: number;
  nome_instituicao: string;
  tipo: string;
  responsavel_nome: string;
  responsavel_email: string;
  telefone?: string | null;
  quantidade_pessoas?: number | null;
  mensagem?: string | null;
  status: 'pendente' | 'em_contato' | 'aprovada' | 'recusada' | 'cancelada';
  observacoes_admin?: string | null;
  institution_id?: number | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
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

  listarSolicitacoesInstitucionais(status?: string) {
    return this.api.get<InstitutionInterestRequest[]>('/admin/institution-requests', status ? { status } : undefined);
  }

  atualizarStatusSolicitacao(id: number, status: string, observacoesAdmin?: string) {
    return this.api.patch<InstitutionInterestRequest>(`/admin/institution-requests/${id}/status`, { status, observacoesAdmin });
  }

  aprovarSolicitacaoInstitucional(id: number) {
    return this.api.post<{ solicitacao: InstitutionInterestRequest; institution: { id: number; nome: string }; convite: { email: string } }>(`/admin/institution-requests/${id}/approve`, {});
  }

  enviarCampanha(tipo: 'progresso' | 'renovacao' | 'inativos' | 'oportunidades' | 'jornada' | 'retorno') {
    return this.api.post<EmailCampaignResult>(`/admin/emails/campanhas/${tipo}`, {});
  }
}
