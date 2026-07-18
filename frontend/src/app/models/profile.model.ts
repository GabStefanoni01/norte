export interface Perfil {
  id?: number;
  user_id?: number;
  escolaridade: string;
  interesses: string[];
  objetivos: string;
  habilidades: string[];
  carreira_interesse?: string;
  perfil_dominante?: string;
  resultado_descoberta?: string;
  areas_sugeridas?: string[];
}

export const INTERESSES_DISPONIVEIS = [
  'Tecnologia',
  'Design',
  'Negócios',
  'Comunicação',
  'Saúde',
  'Educação',
  'Artes',
  'Ciências',
];

export const ESCOLARIDADES = [
  'Ensino Fundamental',
  'Ensino Médio incompleto',
  'Ensino Médio completo',
  'Ensino Superior incompleto',
  'Ensino Superior completo',
  'Pós-graduação',
];
