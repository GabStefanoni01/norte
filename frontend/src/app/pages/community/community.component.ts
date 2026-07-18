import { Component, OnInit, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommunityService } from '../../services/community.service';
import { AuthService } from '../../services/auth.service';
import { CommunityPost, CommunityCommentCreate } from '../../models/community.model';

@Component({
  selector: 'norte-community',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './community.component.html',
})
export class CommunityComponent implements OnInit {
  private communityService = inject(CommunityService);
  router = inject(Router);
  auth = inject(AuthService);

  carregando = signal(true);
  categorias = signal<string[]>([]);
  posts = signal<CommunityPost[]>([]);
  filtroCategoria = signal('');
  query = signal('');
  mensagem = signal<string | null>(null);
  comentariosPorPost = signal<Record<number, string>>({});
  enviandoComentario = signal<number | null>(null);
  enviandoReacao = signal<number | null>(null);

  constructor() {
    effect(() => {
      this.auth.usuarioAtual();
      if (this.auth.estaAutenticado()) {
        this.carregarPosts();
      }
    });
  }

  ngOnInit() {
    this.carregarCategorias();
    this.carregarPosts();
  }

  private carregarCategorias() {
    this.communityService.listarCategorias().subscribe((categorias) => {
      this.categorias.set(categorias);
    });
  }

  private carregarPosts() {
    this.carregando.set(true);
    this.communityService
      .listarPosts({ categoria: this.filtroCategoria() || undefined, q: this.query() || undefined })
      .subscribe({
        next: (posts) => {
          this.posts.set(posts);
          this.carregando.set(false);
        },
        error: () => {
          this.mensagem.set('Não foi possível carregar as publicações. Tente novamente.');
          this.carregando.set(false);
        },
      });
  }

  atualizarFiltros() {
    this.carregarPosts();
  }

  setComentario(postId: number, value: string) {
    this.comentariosPorPost.update((map) => ({ ...map, [postId]: value }));
  }

  comentar(postId: number) {
    if (!this.auth.estaAutenticado()) {
      this.router.navigate(['/entrar']);
      return;
    }

    const conteudo = this.comentariosPorPost()[postId]?.trim();
    if (!conteudo) {
      this.mensagem.set('Digite um comentário antes de enviar.');
      return;
    }

    this.enviandoComentario.set(postId);
    this.communityService.criarComentario(postId.toString(), { conteudo }).subscribe({
      next: () => {
        this.comentariosPorPost.update((map) => ({ ...map, [postId]: '' }));
        this.enviandoComentario.set(null);
        this.mensagem.set('Comentário enviado com sucesso.');
        this.carregarPosts();
      },
      error: () => {
        this.mensagem.set('Não foi possível enviar o comentário. Tente novamente.');
        this.enviandoComentario.set(null);
      },
    });
  }

  curtir(postId: number) {
    if (!this.auth.estaAutenticado()) {
      this.router.navigate(['/entrar']);
      return;
    }

    this.enviandoReacao.set(postId);
    this.communityService.reagir(postId.toString(), { tipo: 'like' }).subscribe({
      next: () => {
        this.enviandoReacao.set(null);
        this.mensagem.set('Reação registrada.');
        this.carregarPosts();
      },
      error: () => {
        this.mensagem.set('Não foi possível reagir. Tente novamente.');
        this.enviandoReacao.set(null);
      },
    });
  }

  excluirPost(postId: number) {
    if (!this.auth.ehAdmin()) {
      return;
    }

    const confirmar = window.confirm('Tem certeza de que deseja excluir esta publicação?');
    if (!confirmar) {
      return;
    }

    this.communityService.removerPost(postId.toString()).subscribe({
      next: () => {
        this.mensagem.set('Publicação excluída.');
        this.carregarPosts();
      },
      error: () => {
        this.mensagem.set('Não foi possível excluir a publicação. Tente novamente.');
      },
    });
  }

  get podeComentar() {
    return this.auth.estaAutenticado();
  }
}
