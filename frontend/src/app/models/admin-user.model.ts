export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  role: 'usuario' | 'admin';
  email_verificado: boolean;
  cidade: string | null;
  estado: string | null;
  created_at: string;
}
