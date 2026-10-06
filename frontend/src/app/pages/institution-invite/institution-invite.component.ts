import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InstitutionsService } from '../../services/institutions.service';

@Component({
  selector: 'norte-institution-invite',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-norte-950 px-5 py-12 text-white">
      <div class="mx-auto max-w-xl">
        <a routerLink="/" class="text-sm text-white/40 hover:text-white">← Voltar ao Norte</a>
        <section class="norte-card mt-12 p-7 sm:p-9">
          @if (processando()) {
            <p class="text-white/50">Confirmando seu convite...</p>
          } @else if (sucesso()) {
            <p class="norte-eyebrow">Convite aceito</p>
            <h1 class="mt-2 font-display text-3xl">{{ sucesso() }}</h1>
            <p class="mt-3 text-white/45">Seu acesso institucional já está ativo.</p>
            <a [routerLink]="['/instituicao', institutionId()]" class="norte-button-primary mt-7 inline-flex">Abrir espaço institucional →</a>
          } @else {
            <p class="norte-eyebrow">Convite institucional</p>
            <h1 class="mt-2 font-display text-3xl">Este convite precisa de uma conta no Norte.</h1>
            <p class="mt-3 text-white/45">{{ erro() || 'Entre ou crie sua conta para continuar.' }}</p>
            <a [routerLink]="['/entrar']" [queryParams]="{ redirectTo: '/convites/instituicao?token=' + token }" class="norte-button-primary mt-7 inline-flex">Entrar para aceitar →</a>
          }
        </section>
      </div>
    </main>
  `,
})
export class InstitutionInviteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private institutions = inject(InstitutionsService);

  token = '';
  processando = signal(true);
  sucesso = signal<string | null>(null);
  erro = signal<string | null>(null);
  institutionId = signal<number | null>(null);

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.processando.set(false);
      this.erro.set('Convite inválido.');
      return;
    }
    // A página é pública; o backend só aceita o convite depois que a conta estiver autenticada.
    this.processando.set(false);
  }

  aceitar() {
    this.institutions.aceitarConvite(this.token).subscribe({
      next: (res) => {
        this.institutionId.set(res.institution.id);
        this.sucesso.set(res.institution.nome);
      },
      error: (err) => this.erro.set(err?.error?.error || 'Não foi possível aceitar o convite.'),
    });
  }
}
