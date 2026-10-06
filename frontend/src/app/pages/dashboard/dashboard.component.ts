import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { PlansService } from '../../services/plans.service';
import { AchievementsService } from '../../services/achievements.service';
import { InstitutionsService, Institution } from '../../services/institutions.service';
import { Perfil } from '../../models/profile.model';
import { Plano } from '../../models/plan.model';
import { StatusGamificacao } from '../../models/achievement.model';

@Component({
  selector: 'norte-dashboard',
  standalone: true,
  imports: [SidebarComponent, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private profileService = inject(ProfileService);
  private plansService = inject(PlansService);
  private achievementsService = inject(AchievementsService);
  private institutionsService = inject(InstitutionsService);

  perfil = signal<Perfil | null>(null);
  plano = signal<Plano | null>(null);
  gamificacao = signal<StatusGamificacao | null>(null);
  instituicoes = signal<Institution[]>([]);
  carregando = signal(true);

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.profileService.buscar().subscribe((perfil) => {
      this.perfil.set(perfil);

      this.plansService.buscarAtual().subscribe((plano) => {
        this.plano.set(plano);
        this.carregando.set(false);
      });
    });

    this.institutionsService.minhas().subscribe((instituicoes) => this.instituicoes.set(instituicoes));

    this.achievementsService.buscarMinhas().subscribe((status) => {
      this.gamificacao.set(status);
    });
  }
}
