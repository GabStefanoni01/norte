import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { Perfil } from '../../models/profile.model';

@Component({
  selector: 'norte-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private profileService = inject(ProfileService);

  perfil = signal<Perfil | null>(null);
  carregando = signal(true);

  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.profileService.buscar().subscribe((perfil) => {
      this.perfil.set(perfil);
      this.carregando.set(false);
    });
  }
}
