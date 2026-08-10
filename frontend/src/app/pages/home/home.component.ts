import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';
import { CommunityService } from '../../services/community.service';
import { CommunityPost } from '../../models/community.model';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'norte-home',
  standalone: true,
  imports: [CommonModule, RouterLink, StarfieldComponent, RevealOnScrollDirective, LogoMarkComponent, FooterComponent, SkeletonLoaderComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private communityService = inject(CommunityService);
  private seo = inject(SeoService);

  menuAberto = signal(false);
  posts = signal<CommunityPost[]>([]);
  carregandoPosts = signal(true);

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

  ngOnInit() {
    this.seo.setMeta({
      title: 'Norte — Mentoria de carreira para jovens',
      description: 'Plano de evolução e mentor IA para jovens que estão começando na carreira. Descubra seu perfil, receba um plano e converse com o mentor.',
    });

    this.communityService.listarPosts({ limit: 4 }).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.carregandoPosts.set(false);
      },
      error: () => {
        this.carregandoPosts.set(false);
      },
    });
  }

  beneficios = [
    { titulo: 'Feito para o começo de carreira', texto: 'Sem experiência? Sem diploma ainda? O Norte parte de onde você está, não de onde deveria estar.' },
    { titulo: 'Plano sob medida', texto: 'Cada plano é gerado a partir do seu perfil e dos seus objetivos — não é uma trilha genérica igual pra todo mundo.' },
    { titulo: 'Mentor sempre disponível', texto: 'Dúvidas às 23h de uma terça? O mentor IA está lá, com contexto do que você já andou.' },
    { titulo: 'Progresso visível', texto: 'Conquistas, níveis e um dashboard que mostra exatamente onde você está no caminho.' },
  ];
  
  timeAgo(iso?: string) {
    if (!iso) return '';
    try {
      const then = new Date(iso).getTime();
      const diff = Date.now() - then;
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return `há ${sec}s`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `há ${min}m`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `há ${hr}h`;
      const days = Math.floor(hr / 24);
      return `há ${days}d`;
    } catch {
      return iso;
    }
  }

  avatarInitials(name?: string) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  avatarColor(name?: string) {
    if (!name) return '#444';
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    const color = `hsl(${h % 360} 60% 40%)`;
    return color;
  }

}
