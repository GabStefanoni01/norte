export interface Usuario {
  id: number;
  nome: string;
  email: string;
  idade?: number;
  cidade?: string;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}
