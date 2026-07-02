import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { ApiService } from './api.service';
import { LoginResponse, Usuario } from '../models/user.model';

const TOKEN_KEY = 'norte_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuarioAtual = signal<Usuario | null>(null);

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login(email: string, senha: string) {
    return this.api.post<LoginResponse>('/auth/login', { email, senha }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        this.usuarioAtual.set(res.user);
      })
    );
  }

  registrar(dados: {
    nome: string;
    email: string;
    senha: string;
    dataNascimento: string;
    estado: string;
    cidade: string;
  }) {
    return this.api.post<{ message: string; user: Usuario }>('/auth/register', dados);
  }

  verificarEmail(email: string, codigo: string) {
    return this.api.post<{ message: string }>('/auth/verificar-email', { email, codigo });
  }

  reenviarCodigoVerificacao(email: string) {
    return this.api.post<{ message: string }>('/auth/reenviar-codigo', { email });
  }

  esqueciSenha(email: string) {
    return this.api.post<{ message: string }>('/auth/esqueci-senha', { email });
  }

  redefinirSenha(email: string, codigo: string, novaSenha: string) {
    return this.api.post<{ message: string }>('/auth/redefinir-senha', { email, codigo, novaSenha });
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this.usuarioAtual.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  estaAutenticado(): boolean {
    return !!this.getToken();
  }
}
