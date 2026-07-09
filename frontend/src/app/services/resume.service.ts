import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Curriculo, PerguntaEntrevista, RespostaEntrevista, SessaoEntrevista } from '../models/resume.model';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private api = inject(ApiService);

  buscarAtual() {
    return this.api.get<Curriculo>('/resume/me').pipe(catchError(() => of(null)));
  }

  gerar() {
    return this.api.post<Curriculo>('/resume/gerar', {});
  }

  listarPerguntasEntrevista() {
    return this.api.get<PerguntaEntrevista[]>('/resume/entrevista/perguntas');
  }

  enviarRespostasEntrevista(respostas: RespostaEntrevista[]) {
    return this.api.post<SessaoEntrevista>('/resume/entrevista/feedback', { respostas });
  }

  buscarUltimaEntrevista() {
    return this.api.get<SessaoEntrevista>('/resume/entrevista/ultima').pipe(catchError(() => of(null)));
  }
}
