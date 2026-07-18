import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CareerService } from '../../services/career.service';
import { ProfileService } from '../../services/profile.service';
import { CareerOption } from '../../models/career.model';
import { Perfil } from '../../models/profile.model';

@Component({
  selector: 'norte-career',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './career.component.html',
})
export class CareerComponent implements OnInit {
  private careerService = inject(CareerService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  carregando = signal(true);
  erro = signal<string | null>(null);
  carreiras = signal<CareerOption[]>([]);
  carreiraSelecionada = signal<CareerOption | null>(null);
  comparacao = signal<CareerOption[]>([]);
  perfil = signal<Perfil | null>(null);
  savedCarreiraId = signal<string | null>(null);
  selectedArea = signal('');
  selectedTechnology = signal('');
  selectedTempo = signal('');
  mensagemComparacao = signal<string | null>(null);
  mensagemSalvar = signal<string | null>(null);
  salvandoInteresse = signal(false);

  areasDisponiveis = computed(() =>
    Array.from(new Set(this.carreiras().flatMap((c) => c.areasAtuacao))).sort()
  );

  tecnologiasDisponiveis = computed(() =>
    Array.from(new Set(this.carreiras().flatMap((c) => c.tecnologias))).sort()
  );

  temposDisponiveis = computed(() =>
    Array.from(new Set(this.carreiras().map((c) => c.tempoMedioEntrada))).sort()
  );

  carreirasFiltradas = computed(() =>
    this.carreiras().filter((carreira) => {
      const areaOk = !this.selectedArea() || carreira.areasAtuacao.includes(this.selectedArea());
      const techOk = !this.selectedTechnology() || carreira.tecnologias.includes(this.selectedTechnology());
      const tempoOk = !this.selectedTempo() || carreira.tempoMedioEntrada === this.selectedTempo();
      return areaOk && techOk && tempoOk;
    })
  );

  comparando = computed(() => this.comparacao().length >= 2);

  ngOnInit() {
    this.carregarPerfil();
    this.carregarCarreiras();
  }

  private carregarPerfil() {
    this.profileService.buscar().subscribe((perfil) => {
      this.perfil.set(perfil);
      this.savedCarreiraId.set(perfil?.carreira_interesse || null);
      this.tentarSelecionarSalvo();
    });
  }

  private tentarSelecionarSalvo() {
    const savedId = this.savedCarreiraId();
    if (!savedId || this.carreiras().length === 0 || this.carreiraSelecionada()) {
      return;
    }

    const encontrada = this.carreiras().find((carreira) => carreira.id === savedId);
    if (encontrada) {
      this.carreiraSelecionada.set(encontrada);
    }
  }

  private carregarCarreiras() {
    this.carregando.set(true);
    this.erro.set(null);
    this.careerService.listar().subscribe({
      next: (carreiras) => {
        this.carreiras.set(carreiras);
        this.carregando.set(false);
        this.tentarSelecionarSalvo();
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar as carreiras. Tente novamente.');
      },
    });
  }

  selecionarCarreira(carreira: CareerOption) {
    this.carreiraSelecionada.set(carreira);
    this.mensagemSalvar.set(null);
  }

  toggleComparacao(carreira: CareerOption) {
    const atual = this.comparacao();
    const existe = atual.some((item) => item.id === carreira.id);

    if (existe) {
      this.comparacao.set(atual.filter((item) => item.id !== carreira.id));
      this.mensagemComparacao.set(null);
      return;
    }

    if (atual.length >= 2) {
      this.mensagemComparacao.set('Você pode comparar até 2 carreiras por vez.');
      return;
    }

    this.comparacao.set([...atual, carreira]);
    this.mensagemComparacao.set(null);
  }

  limparComparacao() {
    this.comparacao.set([]);
    this.mensagemComparacao.set(null);
  }

  salvarInteresse(carreira: CareerOption) {
    this.salvandoInteresse.set(true);
    this.mensagemSalvar.set(null);

    this.profileService.salvar({ carreira_interesse: carreira.id }).subscribe({
      next: (perfil) => {
        this.perfil.set(perfil);
        this.savedCarreiraId.set(carreira.id);
        this.salvandoInteresse.set(false);
        this.mensagemSalvar.set('Carreira salva no seu perfil com sucesso.');
      },
      error: () => {
        this.salvandoInteresse.set(false);
        this.mensagemSalvar.set('Não foi possível salvar sua preferência. Tente novamente.');
      },
    });
  }

  voltar() {
    this.carreiraSelecionada.set(null);
  }

  navegarParaPerfil() {
    this.router.navigate(['/perfil']);
  }
}
