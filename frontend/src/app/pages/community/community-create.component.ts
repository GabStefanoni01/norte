import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CommunityService } from '../../services/community.service';
import { AuthService } from '../../services/auth.service';
import { CommunityPostCreate } from '../../models/community.model';

@Component({
  selector: 'norte-community-create',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './community-create.component.html',
})
export class CommunityCreateComponent {
  private communityService = inject(CommunityService);
  private auth = inject(AuthService);
  private router = inject(Router);

  categorias = signal<string[]>([]);
  titulo = signal('');
  categoria = signal('');
  conteudo = signal('');
  mensagem = signal<string | null>(null);
  salvando = signal(false);

  constructor() {
    if (!this.auth.estaAutenticado()) {
      this.router.navigate(['/entrar'], { queryParams: { redirectTo: '/comunidade/novo' } });
    }

    this.carregarCategorias();
  }

  handlePaste(event: ClipboardEvent) {
    if (!event.clipboardData) {
      return;
    }

    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    if (!imageItem) {
      return;
    }

    event.preventDefault();

    const file = imageItem.getAsFile();
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = reader.result as string;
      const textarea = event.target as HTMLTextAreaElement;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const currentValue = this.conteudo();
      const markdown = `![Imagem colada](${imageDataUrl})`;
      const nextValue = currentValue.slice(0, selectionStart) + markdown + currentValue.slice(selectionEnd);
      this.conteudo.set(nextValue);

      setTimeout(() => {
        textarea.focus();
        const cursor = selectionStart + markdown.length;
        textarea.setSelectionRange(cursor, cursor);
      }, 0);
    };

    reader.readAsDataURL(file);
  }

  private carregarCategorias() {
    this.communityService.listarCategorias().subscribe((categorias) => {
      const categoriasVisiveis = this.auth.ehAdmin()
        ? categorias
        : categorias.filter((categoria) => categoria !== 'Administração');
      this.categorias.set(categoriasVisiveis);
      this.categoria.set(categoriasVisiveis[0] || '');
    });
  }

  criarPublicacao() {
    if (!this.titulo().trim() || !this.categoria() || !this.conteudo().trim()) {
      this.mensagem.set('Preencha título, categoria e conteúdo.');
      return;
    }

    this.salvando.set(true);
    const body: CommunityPostCreate = {
      categoria: this.categoria(),
      titulo: this.titulo().trim(),
      conteudo: this.conteudo().trim(),
    };

    this.communityService.criarPost(body).subscribe({
      next: (post) => {
        this.router.navigate([`/comunidade/${post.id}`]);
      },
      error: (err) => {
        this.mensagem.set(err?.error?.error || 'Não foi possível criar a publicação.');
        this.salvando.set(false);
      },
    });
  }
}
