import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number | undefined>) {
    const filteredParams: Record<string, string> = {};

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          filteredParams[key] = String(value);
        }
      });
    }

    return this.http.get<T>(`${API_URL}${path}`, { params: filteredParams });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${API_URL}${path}`, body);
  }

  patch<T>(path: string, body: unknown) {
    return this.http.patch<T>(`${API_URL}${path}`, body);
  }

  delete<T>(path: string) {
    return this.http.delete<T>(`${API_URL}${path}`);
  }
}
