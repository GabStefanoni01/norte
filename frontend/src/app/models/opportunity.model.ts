export type TipoOportunidade = 'curso' | 'vaga' | 'bolsa' | 'evento' | 'programa';

export interface Oportunidade {
  id: number;
  titulo: string;
  empresa: string | null;
  categoria: string | null;
  tipo: TipoOportunidade;
  descricao: string | null;
  interesse: string | null;
  estado: string | null;
  gratuito: boolean;
  link: string;
  requisitos: string[];
  matchPercent: number;
  faltantes: string[];
}

export const TIPOS_OPORTUNIDADE: { valor: TipoOportunidade; rotulo: string; icone: string }[] = [
  { valor: 'curso', rotulo: 'Curso', icone: '📘' },
  { valor: 'vaga', rotulo: 'Vaga', icone: '💼' },
  { valor: 'bolsa', rotulo: 'Bolsa', icone: '🎓' },
  { valor: 'evento', rotulo: 'Evento', icone: '📅' },
  { valor: 'programa', rotulo: 'Programa', icone: '🚀' },
];
