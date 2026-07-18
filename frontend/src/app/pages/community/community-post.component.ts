import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommunityService } from '../../services/community.service';
import { AuthService } from '../../services/auth.service';
import { CommunityPostDetail } from '../../models/community.model';

@Component({
  selector: 'norte-community-post',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './community-post.component.html',
})
export class CommunityPostComponent implements OnInit {
  private communityService = inject(CommunityService);
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  post = signal<CommunityPostDetail | null>(null);
  carregando = signal(true);
  deletando = signal(false);
  mensagem = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.communityService.buscarPost(id).subscribe({
      next: (post) => {
        this.post.set(post);
        this.carregando.set(false);
      },
      error: () => {
        this.mensagem.set('Não foi possível carregar a publicação.');
        this.carregando.set(false);
      },
    });
  }

  formatContent(content: string): SafeHtml {
    const escaped = this.escapeHtml(content || '');

    const withImages = escaped
      .replace(/!\[(.*?)\]\((data:image\/[^"]+|https?:\/\/[^"]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl border border-norte-800 max-w-full"/>')
      .replace(/(^|\s)(https?:\/\/[^"]+\.(?:png|jpe?g|gif|webp|svg))(?=$|\s)/gi, '$1<img src="$2" alt="Imagem" class="rounded-xl border border-norte-800 max-w-full"/>');

    const withLinks = withImages.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-norte-accent-light underline">$1</a>');
    const withBold = withLinks.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>');
    const withItalic = withBold.replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/_(.+?)_/g, '<em>$1</em>');
    const withStrike = withItalic.replace(/~~(.+?)~~/g, '<s>$1</s>');
    const withBreaks = withStrike.replace(/\n/g, '<br/>');

    return this.sanitizer.bypassSecurityTrustHtml(withBreaks);
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  excluirPost() {
    const postId = this.route.snapshot.paramMap.get('id');
    if (!postId || !this.auth.ehAdmin()) {
      return;
    }

    const confirmar = window.confirm('Tem certeza de que deseja excluir esta publicação?');
    if (!confirmar) {
      return;
    }

    this.deletando.set(true);
    this.communityService.removerPost(postId).subscribe({
      next: () => {
        this.deletando.set(false);
        this.router.navigate(['/comunidade']);
      },
      error: () => {
        this.mensagem.set('Não foi possível excluir a publicação. Tente novamente.');
        this.deletando.set(false);
      },
    });
  }
}
