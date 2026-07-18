export interface CommunityPost {
  id: number;
  categoria: string;
  titulo: string;
  conteudo: string;
  user_id: number;
  autor_nome: string;
  created_at: string;
  updated_at: string;
  reacoes: number;
  comentarios: number;
}

export interface CommunityPostDetail extends Omit<CommunityPost, 'reacoes' | 'comentarios'> {
  comentarios: Array<{ id: number; conteudo: string; user_id: number; autor_nome: string; created_at: string }>;
  reacoes: Array<{ tipo: string; count: number }>;
}

export interface CommunityPostCreate {
  categoria: string;
  titulo: string;
  conteudo: string;
}

export interface CommunityCommentCreate {
  conteudo: string;
}

export interface CommunityReactionCreate {
  tipo?: string;
}
