import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { PlansService } from '../../services/plans.service';
import { Perfil } from '../../models/profile.model';
import { Plano } from '../../models/plan.model';

@Component({
  selector: 'norte-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private profileService = inject(ProfileService);
  private plansService = inject(PlansService);

  perfil = signal<Perfil | null>(null);
  plano = signal<Plano | null>(null);
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
  }
}
