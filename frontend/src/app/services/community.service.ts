import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CommunityPost, CommunityPostDetail, CommunityPostCreate, CommunityCommentCreate, CommunityReactionCreate } from '../models/community.model';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private api = inject(ApiService);

  listarCategorias() {
    return this.api.get<string[]>('/community/categories');
  }

  listarPosts(params?: { categoria?: string; q?: string; limit?: number }) {
    return this.api.get<CommunityPost[]>('/community/posts', params);
  }

  buscarPost(id: string) {
    return this.api.get<CommunityPostDetail>(`/community/posts/${id}`);
  }

  criarPost(body: CommunityPostCreate) {
    return this.api.post<CommunityPost>('/community/posts', body);
  }

  criarComentario(postId: string, body: CommunityCommentCreate) {
    return this.api.post(`/community/posts/${postId}/comments`, body);
  }

  reagir(postId: string, body: CommunityReactionCreate) {
    return this.api.post(`/community/posts/${postId}/reactions`, body);
  }

  removerReacao(postId: string, tipo: string) {
    return this.api.delete(`/community/posts/${postId}/reactions/${tipo}`);
  }

  removerPost(postId: string) {
    return this.api.delete(`/community/posts/${postId}`);
  }
}
