import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface Institution {
  id: number;
  nome: string;
  tipo: string;
  email?: string | null;
  descricao?: string | null;
  ativa: boolean;
  role: 'participante' | 'gestor' | 'administrador';
  status: 'ativo' | 'inativo' | 'pendente';
  vinculado_em: string;
}

export interface InstitutionDashboard {
  institution: { id: number; nome: string; tipo: string; role: 'participante' | 'gestor' | 'administrador' };
  participantes: { total: number; ativos: number };
  perfisCompletos: number;
  trilhasAtivas: number;
  progressoMedio: number;
}

export interface InstitutionParticipant {
  id: number;
  nome: string;
  email: string;
  role: 'participante' | 'gestor' | 'administrador';
  status: 'ativo' | 'inativo' | 'pendente';
  vinculado_em: string;
}

export interface InstitutionTrail {
  id: number;
  institution_id: number;
  titulo: string;
  descricao?: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class InstitutionsService {
  private api = inject(ApiService);

  minhas() {
    return this.api.get<Institution[]>('/institutions/minhas');
  }

  dashboard(id: number) {
    return this.api.get<InstitutionDashboard>(`/institutions/${id}/dashboard`);
  }

  participantes(id: number) {
    return this.api.get<InstitutionParticipant[]>(`/institutions/${id}/participantes`);
  }

  trilhas(id: number) {
    return this.api.get<InstitutionTrail[]>(`/institutions/${id}/trilhas`);
  }

  criarTrilha(id: number, titulo: string, descricao?: string) {
    return this.api.post<InstitutionTrail>(`/institutions/${id}/trilhas`, { titulo, descricao });
  }

  convidar(id: number, email: string, role: 'participante' | 'gestor' | 'administrador' = 'participante') {
    return this.api.post<{ id: number; email: string; role: string; expires_at: string }>(`/institutions/${id}/convites`, { email, role });
  }

  atualizarMembro(institutionId: number, memberId: number, data: { role?: string; status?: string }) {
    return this.api.patch<InstitutionParticipant>(`/institutions/${institutionId}/participantes/${memberId}`, data);
  }

  aceitarConvite(token: string) {
    return this.api.post<{ membership: { id: number; institution_id: number; user_id: number; role: string; status: string }; institution: { id: number; nome: string } }>(
      '/institutions/convites/aceitar',
      { token },
    );
  }
}
