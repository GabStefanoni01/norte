import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { StatusGamificacao } from '../models/achievement.model';

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  private api = inject(ApiService);

  buscarMinhas() {
    return this.api.get<StatusGamificacao>('/achievements/me').pipe(catchError(() => of(null)));
  }
}
