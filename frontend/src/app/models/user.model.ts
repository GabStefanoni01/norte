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
