export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  role: 'usuario' | 'admin';
  email_verificado: boolean;
  cidade: string | null;
  estado: string | null;
  created_at: string;
  aceite_termos_versao: number | null;
  aceite_termos_em: string | null;
  aceite_termos_recusado_em: string | null;
}
