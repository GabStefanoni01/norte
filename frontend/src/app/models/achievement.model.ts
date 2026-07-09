export interface Conquista {
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  conquistada: boolean;
  conquistadoEm: string | null;
}

export interface ProximoNivel {
  nome: string;
  minimo: number;
}

export interface StatusGamificacao {
  nivel: string;
  proximoNivel: ProximoNivel | null;
  totalConquistas: number;
  totalPossivel: number;
  conquistas: Conquista[];
}
