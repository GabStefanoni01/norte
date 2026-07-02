import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Estado, Cidade } from '../models/location.model';

const IBGE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

/**
 * Serviço de localização usando a API pública do IBGE. Isolado em um service
 * próprio (fora do ApiService do backend) porque consome uma API externa
 * de terceiros, não a API do Norte.
 */
@Injectable({ providedIn: 'root' })
export class LocationsService {
  constructor(private http: HttpClient) {}

  getEstados(): Observable<Estado[]> {
    return this.http
      .get<Estado[]>(`${IBGE_URL}/estados?orderBy=nome`)
      .pipe(map((estados) => estados.map(({ id, sigla, nome }) => ({ id, sigla, nome }))));
  }

  getCidadesPorEstado(uf: string): Observable<Cidade[]> {
    return this.http
      .get<Cidade[]>(`${IBGE_URL}/estados/${uf}/municipios`)
      .pipe(map((cidades) => cidades.map(({ id, nome }) => ({ id, nome }))));
  }
}
