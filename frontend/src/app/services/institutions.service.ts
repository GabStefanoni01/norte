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

export interface InstitutionTrailMember {
  id: number;
  user_id: number;
  nome: string;
  email: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  progresso: number;
  created_at: string;
  updated_at: string;
}

export interface InstitutionJourney {
  membership_id: number;
  trail_id: number;
  titulo: string;
  descricao?: string | null;
  ativa: boolean;
  status: 'pendente' | 'em_andamento' | 'concluida';
  progresso: number;
  created_at: string;
  updated_at: string;
}

export interface InstitutionTrailCriteria {
  interesses?: string[];
  habilidades?: string[];
  escolaridades?: string[];
  carreiras?: string[];
  cidades?: string[];
}

export interface InstitutionTrailMatch {
  percentual: number;
  criteriosAtendidos: number;
  criteriosTotais: number;
  motivos: Array<{ criterio: string; itens: string[]; peso: number }>;
  lacunas: Array<{ criterio: string; itens: string[] }>;
  semCriterios: boolean;
}

export interface InstitutionTrail {
  id: number;
  institution_id: number;
  titulo: string;
  descricao?: string | null;
  criterios?: InstitutionTrailCriteria;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionTrailMatchResult extends InstitutionTrail {
  match: InstitutionTrailMatch;
}

export interface InstitutionTrailParticipantMatch {
  user: {
    id: number;
    nome: string;
    email: string;
    role: 'participante' | 'gestor' | 'administrador';
  };
  match: InstitutionTrailMatch;
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

  atualizarCriterios(institutionId: number, trailId: number, criterios: InstitutionTrailCriteria) {
    return this.api.patch<InstitutionTrail>(
      `/institutions/${institutionId}/trilhas/${trailId}/criterios`,
      { criterios },
    );
  }

  matchesParaUsuario(institutionId: number, limite = 10) {
    return this.api.get<InstitutionTrailMatchResult[]>(
      `/institutions/${institutionId}/trilhas/matches?limite=${limite}`,
    );
  }

  matchesDaTrilha(institutionId: number, trailId: number, limite = 50) {
    return this.api.get<InstitutionTrailParticipantMatch[]>(
      `/institutions/${institutionId}/trilhas/${trailId}/matches?limite=${limite}`,
    );
  }

  convidar(id: number, email: string, role: 'participante' | 'gestor' | 'administrador' = 'participante') {
    return this.api.post<{ id: number; email: string; role: string; expires_at: string }>(`/institutions/${id}/convites`, { email, role });
  }

  membrosDaTrilha(institutionId: number, trailId: number) {
    return this.api.get<InstitutionTrailMember[]>(`/institutions/${institutionId}/trilhas/${trailId}/participantes`);
  }

  atribuirParticipante(institutionId: number, trailId: number, participanteId: number) {
    return this.api.post<{ id: number; trail_id: number; user_id: number; status: string; progresso: number }>(
      `/institutions/${institutionId}/trilhas/${trailId}/participantes`, { participanteId },
    );
  }

  minhasJornadas(institutionId: number) {
    return this.api.get<InstitutionJourney[]>(`/institutions/${institutionId}/minhas-jornadas`);
  }

  atualizarProgresso(institutionId: number, trailId: number, data: { status?: string; progresso?: number; userId?: number }) {
    return this.api.patch<InstitutionJourney>(`/institutions/${institutionId}/trilhas/${trailId}/progresso`, data);
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
