export interface Curriculo {
  id: number;
  user_id: number;
  conteudo: string;
  gerado_por_ia: boolean;
  created_at: string;
}

export interface PerguntaEntrevista {
  id: string;
  texto: string;
}

export interface RespostaEntrevista {
  pergunta: string;
  resposta: string;
}

export interface SessaoEntrevista {
  id: number;
  user_id: number;
  perguntas_respostas: RespostaEntrevista[];
  feedback: string;
  gerado_por_ia: boolean;
  created_at: string;
}
