export interface StatusAssinatura {
  plano: 'free' | 'premium';
  premiumAte: string | null;
  trialAtivo: boolean;
  assinaturaAtiva: boolean;
}
