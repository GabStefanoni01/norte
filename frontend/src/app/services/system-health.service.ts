import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface HealthResponse {
  status: 'ok' | string;
  uptimeSeconds?: number;
}

export interface ReadyResponse {
  status: 'ready' | 'unavailable' | string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class SystemHealthService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  health() {
    return this.http.get<HealthResponse>(`${this.apiUrl}/health`);
  }

  ready() {
    return this.http.get<ReadyResponse>(`${this.apiUrl}/ready`);
  }
}
