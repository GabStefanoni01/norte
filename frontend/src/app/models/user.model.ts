export interface Usuario {
  id: number;
  nome: string;
  email: string;
  idade?: number;
  cidade?: string;
  role?: 'usuario' | 'admin';
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}

export interface DadosPessoais {
  id: number;
  nome: string;
  email: string;
  idade: number | null;
  cidade: string | null;
  estado: string | null;
  data_nascimento: string | null;
  created_at: string;
}
