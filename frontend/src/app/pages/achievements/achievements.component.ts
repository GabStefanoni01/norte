import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AchievementsService } from '../../services/achievements.service';
import { StatusGamificacao } from '../../models/achievement.model';

@Component({
  selector: 'norte-achievements',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './achievements.component.html',
})
export class AchievementsComponent implements OnInit {
  private achievementsService = inject(AchievementsService);

  carregando = signal(true);
  status = signal<StatusGamificacao | null>(null);

  progressoNivel = computed(() => {
    const s = this.status();
    if (!s || !s.proximoNivel) return 100;
    return Math.round((s.totalConquistas / s.proximoNivel.minimo) * 100);
  });

  ngOnInit() {
    this.achievementsService.buscarMinhas().subscribe((status) => {
      this.status.set(status);
      this.carregando.set(false);
    });
  }
}
