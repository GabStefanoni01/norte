import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

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
  private api = inject(ApiService);

  health() {
    return this.api.get<HealthResponse>('/health');
  }

  ready() {
    return this.api.get<ReadyResponse>('/ready');
  }
}
