import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { DiscoveryService } from '../../services/discovery.service';
import { PerguntaDescoberta, RespostaDescoberta, ResultadoDescoberta } from '../../models/discovery.model';

const NOMES_CATEGORIA: Record<string, string> = {
  criativo: 'Criativo',
  analitico: 'Analítico',
  social: 'Social',
  organizador: 'Organizador',
};

@Component({
  selector: 'norte-discovery',
  standalone: true,
  imports: [NavbarComponent, RouterLink],
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
      this.enviar(novasRespostas);
    }
  }

  voltar() {
    if (this.passoAtual() > 0) {
      this.passoAtual.update((p) => p - 1);
    }
  }

  private enviar(respostas: RespostaDescoberta[]) {
    this.enviando.set(true);
    this.erro.set(null);

    this.discovery.enviarRespostas(respostas).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
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
