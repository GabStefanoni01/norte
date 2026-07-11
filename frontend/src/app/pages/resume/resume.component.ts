import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ResumeService } from '../../services/resume.service';
import {
  Curriculo,
  PerguntaEntrevista,
  RespostaEntrevista,
  SessaoEntrevista,
} from '../../models/resume.model';

type Aba = 'curriculo' | 'entrevista';

@Component({
  selector: 'norte-resume',
  standalone: true,
  imports: [SidebarComponent, FormsModule],
  templateUrl: './resume.component.html',
})
export class ResumeComponent implements OnInit {
  private resumeService = inject(ResumeService);

  abaAtiva = signal<Aba>('curriculo');

  // --- Currículo ---
  curriculo = signal<Curriculo | null>(null);
  carregandoCurriculo = signal(true);
  gerandoCurriculo = signal(false);
  erroCurriculo = signal<string | null>(null);
  copiado = signal(false);

  // --- Entrevista ---
  carregandoEntrevista = signal(true);
  perguntas = signal<PerguntaEntrevista[]>([]);
  passoAtual = signal(0);
  respostaAtual = '';
  respostas = signal<RespostaEntrevista[]>([]);
  enviandoRespostas = signal(false);
  sessao = signal<SessaoEntrevista | null>(null);
  erroEntrevista = signal<string | null>(null);
  emAndamento = signal(false);

  progresso = computed(() =>
    this.perguntas().length ? Math.round((this.passoAtual() / this.perguntas().length) * 100) : 0
  );
  perguntaAtual = computed(() => this.perguntas()[this.passoAtual()] ?? null);

  ngOnInit() {
    this.carregarCurriculo();
    this.carregarUltimaEntrevista();
  }

  mudarAba(aba: Aba) {
    this.abaAtiva.set(aba);
  }

  // ===== Currículo =====

  private carregarCurriculo() {
    this.carregandoCurriculo.set(true);
    this.resumeService.buscarAtual().subscribe((curriculo) => {
      this.curriculo.set(curriculo);
      this.carregandoCurriculo.set(false);
    });
  }

  gerarCurriculo() {
    this.erroCurriculo.set(null);
    this.gerandoCurriculo.set(true);

    this.resumeService.gerar().subscribe({
      next: (curriculo) => {
        this.curriculo.set(curriculo);
        this.gerandoCurriculo.set(false);
      },
      error: () => {
        this.erroCurriculo.set('Não foi possível gerar seu currículo. Tente novamente.');
        this.gerandoCurriculo.set(false);
      },
    });
  }

  copiarCurriculo() {
    const conteudo = this.curriculo()?.conteudo;
    if (!conteudo) return;

    navigator.clipboard.writeText(conteudo).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  baixarCurriculo() {
    const conteudo = this.curriculo()?.conteudo;
    if (!conteudo) return;

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'curriculo-norte.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== Entrevista =====

  private carregarUltimaEntrevista() {
    this.carregandoEntrevista.set(true);
    this.resumeService.buscarUltimaEntrevista().subscribe((sessao) => {
      this.sessao.set(sessao);
      this.carregandoEntrevista.set(false);
    });
  }

  iniciarSimulacao() {
    this.emAndamento.set(true);
    this.sessao.set(null);
    this.passoAtual.set(0);
    this.respostas.set([]);
    this.respostaAtual = '';
    this.erroEntrevista.set(null);
    this.carregandoEntrevista.set(true);

    this.resumeService.listarPerguntasEntrevista().subscribe({
      next: (perguntas) => {
        this.perguntas.set(perguntas);
        this.carregandoEntrevista.set(false);
      },
      error: () => {
        this.erroEntrevista.set('Não foi possível carregar as perguntas.');
        this.carregandoEntrevista.set(false);
        this.emAndamento.set(false);
      },
    });
  }

  proximaPergunta() {
    const pergunta = this.perguntaAtual();
    if (!pergunta || !this.respostaAtual.trim()) return;

    const novasRespostas = [...this.respostas(), { pergunta: pergunta.texto, resposta: this.respostaAtual.trim() }];
    this.respostas.set(novasRespostas);
    this.respostaAtual = '';

    if (this.passoAtual() < this.perguntas().length - 1) {
      this.passoAtual.update((p) => p + 1);
    } else {
      this.finalizarSimulacao(novasRespostas);
    }
  }

  private finalizarSimulacao(respostas: RespostaEntrevista[]) {
    this.enviandoRespostas.set(true);
    this.erroEntrevista.set(null);

    this.resumeService.enviarRespostasEntrevista(respostas).subscribe({
      next: (sessao) => {
        this.sessao.set(sessao);
        this.emAndamento.set(false);
        this.enviandoRespostas.set(false);
      },
      error: () => {
        this.erroEntrevista.set('Não foi possível calcular seu feedback. Tente novamente.');
        this.enviandoRespostas.set(false);
      },
    });
  }
}
