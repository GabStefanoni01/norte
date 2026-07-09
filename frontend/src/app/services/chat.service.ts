import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { MensagemChat } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = inject(ApiService);

  enviarMensagem(mensagem: string) {
    return this.api.post<{ message: string }>('/ai/chat', { mensagem });
  }

  buscarHistorico(limit = 30) {
    return this.api.get<MensagemChat[]>('/ai/chat/history', { limit });
  }
}
