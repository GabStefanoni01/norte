import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'norte-accept-terms',
  standalone: true,
  imports: [RouterLink, StarfieldComponent, LogoMarkComponent],
  templateUrl: './accept-terms.component.html',
})
export class AcceptTermsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  email = '';
  token = '';
  processando = signal(false);
  resultado = signal<'aceito' | 'recusado' | null>(null);
  mensagem = signal<string | null>(null);
  erro = signal<string | null>(null);

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.email || !this.token) {
      this.erro.set('Link inválido. Confira se você copiou o link completo do e-mail.');
    }
  }

  responder(aceito: boolean) {
    this.processando.set(true);
    this.erro.set(null);

    this.api
      .post<{ message: string }>('/politica/responder', { email: this.email, token: this.token, aceito })
      .subscribe({
        next: (res) => {
          this.processando.set(false);
          this.resultado.set(aceito ? 'aceito' : 'recusado');
          this.mensagem.set(res.message);
        },
        error: (err) => {
          this.processando.set(false);
          this.erro.set(err?.error?.error ?? 'Não foi possível processar sua resposta.');
        },
      });
  }
}
