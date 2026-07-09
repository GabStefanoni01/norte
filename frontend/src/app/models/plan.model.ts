export type StatusItem = 'pendente' | 'em_andamento' | 'concluido';

export interface ItemPlano {
  id: string;
  descricao: string;
  tipo: 'aprender' | 'projeto';
  status: StatusItem;
}

export interface MesPlano {
  mes: number;
  titulo: string;
  itens: ItemPlano[];
}

export interface ProximoPasso {
  mes: number;
  tituloMes: string;
  item: ItemPlano;
}

export interface Plano {
  id: number;
  user_id: number;
  etapas: MesPlano[];
  progresso: number;
  gerado_por_ia: boolean;
  proximoPasso: ProximoPasso | null;
  perfilDesatualizado?: boolean;
  precisaRenovar?: boolean;
  diasDesdeCriacao?: number;
  created_at: string;
}

export interface ReflexaoConclusao {
  dificuldade?: number;
  aprendizado?: string;
}
