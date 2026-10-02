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

export interface MetricsResponse {
  totalRequests: number;
  totalErrors: number;
  totalServerErrors: number;
  totalClientErrors: number;
  slowRequests: number;
  averageDurationMs: number;
  statusCodes: Record<string, number>;
}

export interface CollectorStateResponse {
  status: 'idle' | 'running' | 'success' | 'failed' | string;
  inicio_ultima_execucao?: string | null;
  fim_ultima_execucao?: string | null;
  ultima_execucao_sucesso?: string | null;
  ultima_falha_em?: string | null;
  ultima_falha_mensagem?: string | null;
}

export interface ObservabilityResponse {
  status: string;
  uptimeSeconds: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers?: number;
  };
  requests: MetricsResponse;
  collector: CollectorStateResponse;
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

  observabilidade() {
    return this.api.get<ObservabilityResponse>('/admin/observabilidade');
  }
}
