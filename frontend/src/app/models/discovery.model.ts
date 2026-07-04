export interface PerguntaDescoberta {
  id: string;
  texto: string;
  opcoes: { id: string; texto: string }[];
}

export interface RespostaDescoberta {
  perguntaId: string;
  opcaoId: string;
}

export interface ResultadoDescoberta {
  perfilDominante: string;
  descricao: string;
  areasSugeridas: string[];
  pontuacao?: Record<string, number>;
  areasSecundarias?: string[];
  geradoPorIA?: boolean;
  reflexao?: string;
}
