import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Perfil } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = inject(ApiService);

  buscar() {
    // 404 (perfil ainda não existe) não deve quebrar quem chama — retorna null.
    return this.api.get<Perfil>('/profile').pipe(catchError(() => of(null)));
  }

  salvar(perfil: Partial<Perfil>) {
    return this.api.post<Perfil>('/profile', perfil);
  }
}
