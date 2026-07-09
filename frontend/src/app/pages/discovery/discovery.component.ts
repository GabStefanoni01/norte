import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { DiscoveryService } from '../../services/discovery.service';
import { PerguntaDescoberta, RespostaDescoberta, ResultadoDescoberta } from '../../models/discovery.model';

const NOMES_CATEGORIA: Record<string, string> = {
  criativo: 'Criativo',
  analitico: 'Analítico',
  social: 'Social',
  organizador: 'Organizador',
};

const PERGUNTAS_REFLEXAO = [
  { chave: 'motivacao', texto: 'O que te motiva a evoluir profissionalmente agora?' },
  { chave: 'visaoFutura', texto: 'Como você se imagina daqui a alguns anos?' },
];

@Component({
  selector: 'norte-discovery',
  standalone: true,
  imports: [NavbarComponent, RouterLink, FormsModule],
  templateUrl: './discovery.component.html',
})
export class DiscoveryComponent implements OnInit {
  private discovery = inject(DiscoveryService);
  private router = inject(Router);

  carregando = signal(true);
  enviando = signal(false);
  erro = signal<string | null>(null);
  perguntas = signal<PerguntaDescoberta[]>([]);
  respostas = signal<RespostaDescoberta[]>([]);
  passoAtual = signal(0);
  resultado = signal<ResultadoDescoberta | null>(null);
  mostrarRecap = signal(false);

  // Perguntas abertas mostradas depois do múltipla-escolha, antes de calcular o resultado.
  perguntasReflexao = PERGUNTAS_REFLEXAO;
  mostrandoReflexao = signal(false);
  respostasReflexao: Record<string, string> = {};

  progresso = computed(() =>
    this.perguntas().length ? Math.round((this.passoAtual() / this.perguntas().length) * 100) : 0
  );

  perguntaAtual = computed(() => this.perguntas()[this.passoAtual()] ?? null);

  breakdown = computed(() => {
    const pontuacao = this.resultado()?.pontuacao;
    if (!pontuacao) return [];

    const total = Object.values(pontuacao).reduce((soma, v) => soma + v, 0) || 1;

    return Object.entries(pontuacao)
      .map(([categoria, valor]) => ({
        categoria,
        nome: NOMES_CATEGORIA[categoria] ?? categoria,
        valor,
        percentual: Math.round((valor / total) * 100),
      }))
      .sort((a, b) => b.valor - a.valor);
  });

  recap = computed(() => {
    return this.respostas()
      .map((resposta) => {
        const pergunta = this.perguntas().find((p) => p.id === resposta.perguntaId);
        const opcao = pergunta?.opcoes.find((o) => o.id === resposta.opcaoId);
        return pergunta && opcao ? { pergunta: pergunta.texto, resposta: opcao.texto } : null;
      })
      .filter((item): item is { pergunta: string; resposta: string } => item !== null);
  });

  ngOnInit() {
    this.carregarResultadoOuQuiz();
  }

  private carregarResultadoOuQuiz() {
    // Se a pessoa já fez o teste antes, mostra o resultado direto.
    this.discovery.buscarResultado().subscribe((resultado) => {
      if (resultado) {
        this.resultado.set(resultado);
        this.carregando.set(false);
        return;
      }

      this.carregarPerguntas();
    });
  }

  private carregarPerguntas() {
    this.carregando.set(true);
    this.discovery.listarPerguntas().subscribe({
      next: (perguntas) => {
        this.perguntas.set(perguntas);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o teste.');
        this.carregando.set(false);
      },
    });
  }

  refazerTeste() {
    this.resultado.set(null);
    this.respostas.set([]);
    this.passoAtual.set(0);
    this.mostrandoReflexao.set(false);
    this.mostrarRecap.set(false);
    this.respostasReflexao = {};
    this.carregarPerguntas();
  }

  escolher(opcaoId: string) {
    const pergunta = this.perguntaAtual();
    if (!pergunta) return;

    const novasRespostas = [
      ...this.respostas().filter((r) => r.perguntaId !== pergunta.id),
      { perguntaId: pergunta.id, opcaoId },
    ];
    this.respostas.set(novasRespostas);

    if (this.passoAtual() < this.perguntas().length - 1) {
      this.passoAtual.update((p) => p + 1);
    } else {
      this.mostrandoReflexao.set(true);
    }
  }

  voltar() {
    if (this.passoAtual() > 0) {
      this.passoAtual.update((p) => p - 1);
    }
  }

  finalizarReflexao() {
    this.enviar(this.respostas());
  }

  private montarReflexaoCombinada(): string | undefined {
    const partes = this.perguntasReflexao
      .map((p) => ({ ...p, resposta: this.respostasReflexao[p.chave]?.trim() }))
      .filter((p) => p.resposta);

    if (partes.length === 0) return undefined;

    return partes.map((p) => `${p.texto} ${p.resposta}`).join('\n');
  }

  private enviar(respostas: RespostaDescoberta[]) {
    this.enviando.set(true);
    this.erro.set(null);

    this.discovery.enviarRespostas(respostas, this.montarReflexaoCombinada()).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        this.mostrandoReflexao.set(false);
        this.resultado.set(resultado);
      },
      error: () => {
        this.enviando.set(false);
        this.erro.set('Não foi possível calcular seu resultado. Tente novamente.');
      },
    });
  }

  irParaDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
