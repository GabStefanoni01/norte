import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InstitutionsService, InstitutionDashboard, InstitutionParticipant, InstitutionTrail, InstitutionTrailMember, InstitutionJourney } from '../../services/institutions.service';

@Component({
  selector: 'norte-institution-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './institution-dashboard.component.html',
})
export class InstitutionDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private institutions = inject(InstitutionsService);

  id = 0;
  dashboard = signal<InstitutionDashboard | null>(null);
  participantes = signal<InstitutionParticipant[]>([]);
  trilhas = signal<InstitutionTrail[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);
  mensagem = signal<string | null>(null);
  role = signal<'participante' | 'gestor' | 'administrador'>('participante');
  conviteEmail = '';
  conviteRole: 'participante' | 'gestor' | 'administrador' = 'participante';
  trilhaTitulo = '';
  trilhaDescricao = '';
  membrosTrilha = signal<Record<number, InstitutionTrailMember[]>>({});
  participanteParaTrilha = signal<Record<number, number | null>>({});
  minhasJornadas = signal<InstitutionJourney[]>([]);

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
  }

  carregar() {
    this.carregando.set(true);
    this.institutions.dashboard(this.id).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.role.set(data.institution.role);
        if (data.institution.role !== 'participante') {
          this.institutions.participantes(this.id).subscribe((p) => this.participantes.set(p));
        }
        this.institutions.trilhas(this.id).subscribe((t) => {
          this.trilhas.set(t);
          if (data.institution.role === 'participante') {
            this.institutions.minhasJornadas(this.id).subscribe((j) => this.minhasJornadas.set(j));
          } else {
            t.forEach((trail) => this.carregarMembrosTrilha(trail.id));
          }
          this.carregando.set(false);
        });
      },
      error: (err) => {
        this.erro.set(err?.error?.error || 'Não foi possível acessar esta instituição.');
        this.carregando.set(false);
      },
    });
  }

  convidar() {
    if (!this.conviteEmail.trim()) return;
    this.mensagem.set(null);
    this.institutions.convidar(this.id, this.conviteEmail.trim(), this.conviteRole).subscribe({
      next: () => {
        this.mensagem.set('Convite enviado com sucesso.');
        this.conviteEmail = '';
      },
      error: (err) => this.mensagem.set(err?.error?.error || 'Não foi possível enviar o convite.'),
    });
  }

  criarTrilha() {
    if (!this.trilhaTitulo.trim()) return;
    this.institutions.criarTrilha(this.id, this.trilhaTitulo.trim(), this.trilhaDescricao.trim()).subscribe({
      next: () => {
        this.mensagem.set('Trilha criada com sucesso.');
        this.trilhaTitulo = '';
        this.trilhaDescricao = '';
        this.institutions.trilhas(this.id).subscribe((t) => this.trilhas.set(t));
      },
      error: (err) => this.mensagem.set(err?.error?.error || 'Não foi possível criar a trilha.'),
    });
  }

  carregarMembrosTrilha(trailId: number) {
    this.institutions.membrosDaTrilha(this.id, trailId).subscribe({
      next: (membros) => this.membrosTrilha.update((atual) => ({ ...atual, [trailId]: membros })),
    });
  }

  selecionarParticipante(trailId: number, userId: string) {
    const value = Number(userId);
    this.participanteParaTrilha.update((atual) => ({ ...atual, [trailId]: Number.isFinite(value) && value > 0 ? value : null }));
  }

  atribuir(trailId: number) {
    const participanteId = this.participanteParaTrilha()[trailId];
    if (!participanteId) return;
    this.institutions.atribuirParticipante(this.id, trailId, participanteId).subscribe({
      next: () => {
        this.mensagem.set('Participante adicionado à trilha.');
        this.carregarMembrosTrilha(trailId);
        this.participanteParaTrilha.update((atual) => ({ ...atual, [trailId]: null }));
      },
      error: (err) => this.mensagem.set(err?.error?.error || 'Não foi possível atribuir o participante.'),
    });
  }

  atualizarProgresso(jornada: InstitutionJourney, progresso: string) {
    const value = Number(progresso);
    if (!Number.isFinite(value) || value < 0 || value > 100) return;
    const status = value >= 100 ? 'concluida' : value > 0 ? 'em_andamento' : 'pendente';
    this.institutions.atualizarProgresso(this.id, jornada.trail_id, { progresso: value, status }).subscribe({
      next: (atualizado) => this.minhasJornadas.update((lista) => lista.map((item) => item.membership_id === atualizado.membership_id ? { ...item, ...atualizado } : item)),
      error: (err) => this.mensagem.set(err?.error?.error || 'Não foi possível atualizar seu progresso.'),
    });
  }

  atualizarMembro(member: InstitutionParticipant, status: string) {
    this.institutions.atualizarMembro(this.id, member.id, { status }).subscribe({
      next: (atualizado) => {
        this.participantes.update((lista) => lista.map((item) => item.id === atualizado.id ? atualizado : item));
      },
      error: (err) => this.mensagem.set(err?.error?.error || 'Não foi possível atualizar o participante.'),
    });
  }
}
