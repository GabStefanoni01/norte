import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { PerguntaDescoberta, RespostaDescoberta, ResultadoDescoberta } from '../models/discovery.model';

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private api = inject(ApiService);

  listarPerguntas() {
    return this.api.get<PerguntaDescoberta[]>('/discovery/perguntas');
  }

  enviarRespostas(respostas: RespostaDescoberta[], reflexao?: string) {
    return this.api.post<ResultadoDescoberta>('/discovery/respostas', { respostas, reflexao });
  }

  buscarResultado() {
    return this.api.get<ResultadoDescoberta>('/discovery/resultado').pipe(catchError(() => of(null)));
  }
}
