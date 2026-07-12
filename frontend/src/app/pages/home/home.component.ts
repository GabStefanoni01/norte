import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'norte-home',
  standalone: true,
  imports: [RouterLink, StarfieldComponent, RevealOnScrollDirective, LogoMarkComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  anoAtual = new Date().getFullYear();
  menuAberto = signal(false);

  etapas = [
    {
      titulo: 'Conte sua história',
      texto: 'Idade, cidade, escolaridade e o que você já tentou. É o ponto de partida do seu mapa.',
    },
    {
      titulo: 'Descubra seu perfil',
      texto: 'Um teste rápido identifica com o que você mais se identifica: criar, resolver, organizar, comunicar.',
    },
    {
      titulo: 'Receba um plano real',
      texto: 'Nada de "estude programação". Um passo a passo mês a mês, com projetos práticos pra fazer.',
    },
    {
      titulo: 'Converse com o mentor',
      texto: 'Travou? Desanimou? O mentor IA conhece seu histórico e ajuda a ajustar a rota, não só responde perguntas.',
    },
  ];

  beneficios = [
    { titulo: 'Feito para o começo de carreira', texto: 'Sem experiência? Sem diploma ainda? O Norte parte de onde você está, não de onde deveria estar.' },
    { titulo: 'Plano sob medida', texto: 'Cada plano é gerado a partir do seu perfil e dos seus objetivos — não é uma trilha genérica igual pra todo mundo.' },
    { titulo: 'Mentor sempre disponível', texto: 'Dúvidas às 23h de uma terça? O mentor IA está lá, com contexto do que você já andou.' },
    { titulo: 'Progresso visível', texto: 'Conquistas, níveis e um dashboard que mostra exatamente onde você está no caminho.' },
  ];
}
