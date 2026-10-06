import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'norte-institution-interest',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="min-h-screen bg-norte-950 px-5 py-12 text-white sm:px-8 lg:px-10">
      <div class="mx-auto max-w-3xl">
        <a href="/" class="text-sm text-white/45 hover:text-white">← Voltar para o Norte</a>

        <div class="mt-12 max-w-2xl">
          <p class="norte-eyebrow">Para instituições</p>
          <h1 class="font-display mt-3 text-4xl sm:text-5xl">Leve o Norte para sua instituição.</h1>
          <p class="mt-5 text-lg leading-relaxed text-white/55">
            Empresas, escolas, faculdades, ETECs e organizações podem usar o Norte para
            acompanhar jornadas profissionais e desenvolver pessoas com mais contexto.
          </p>
        </div>

        @if (enviado()) {
          <section class="norte-card mt-10 p-7 sm:p-9">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">✓</div>
            <h2 class="mt-5 text-2xl font-semibold">Recebemos seu interesse.</h2>
            <p class="mt-3 leading-relaxed text-white/50">
              Nossa equipe vai analisar a solicitação e entrar em contato com o responsável informado.
            </p>
            <a href="/" class="norte-button-secondary mt-7 inline-flex">Voltar ao Norte</a>
          </section>
        } @else {
          <form class="norte-card mt-10 p-6 sm:p-9" (ngSubmit)="enviar()">
            <div class="grid gap-5 sm:grid-cols-2">
              <label class="sm:col-span-2">
                <span class="text-sm text-white/65">Nome da instituição *</span>
                <input name="nomeInstituicao" [(ngModel)]="form.nomeInstituicao" required maxlength="180"
                  class="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-norte-accent"
                  placeholder="Ex.: Escola Horizonte" />
              </label>

              <label>
                <span class="text-sm text-white/65">Tipo *</span>
                <select name="tipo" [(ngModel)]="form.tipo" required
                  class="mt-2 w-full rounded-xl border border-white/10 bg-norte-900 px-4 py-3 text-white outline-none focus:border-norte-accent">
                  <option value="" disabled>Selecione</option>
                  <option value="empresa">Empresa</option>
                  <option value="escola">Escola</option>
                  <option value="faculdade">Faculdade</option>
                  <option value="etec">ETEC</option>
                  <option value="ong">ONG</option>
                  <option value="outra">Outra</option>
                </select>
              </label>

              <label>
                <span class="text-sm text-white/65">Quantidade de pessoas</span>
                <input name="quantidadePessoas" [(ngModel)]="form.quantidadePessoas" type="number" min="1"
                  class="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-norte-accent"
                  placeholder="Ex.: 100" />
              </label>

              <label>
                <span class="text-sm text-white/65">Nome do responsável *</span>
                <input name="responsavelNome" [(ngModel)]="form.responsavelNome" required maxlength="150"
                  class="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-norte-accent"
                  placeholder="Seu nome" />
              </label>

              <label>
                <span class="text-sm text-white/65">E-mail profissional *</span>
                <input name="responsavelEmail" [(ngModel)]="form.responsavelEmail" type="email" required maxlength="180"
                  class="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-norte-accent"
                  placeholder="voce@empresa.com" />
              </label>

              <label>
                <span class="text-sm text-white/65">Telefone</span>
                <input name="telefone" [(ngModel)]="form.telefone" maxlength="30"
                  class="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-norte-accent"
                  placeholder="(11) 99999-9999" />
              </label>

              <label class="sm:col-span-2">
                <span class="text-sm text-white/65">Conte um pouco sobre o que você procura</span>
                <textarea name="mensagem" [(ngModel)]="form.mensagem" rows="5" maxlength="2000"
                  class="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none focus:border-norte-accent"
                  placeholder="Como o Norte poderia ajudar sua instituição?"></textarea>
              </label>
            </div>

            @if (erro()) {
              <div class="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {{ erro() }}
              </div>
            }

            <div class="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="max-w-md text-xs leading-relaxed text-white/35">
                O envio não cria uma instituição automaticamente. A equipe do Norte analisa cada solicitação antes de liberar o acesso.
              </p>
              <button type="submit" [disabled]="enviando()"
                class="norte-button-primary justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {{ enviando() ? 'Enviando...' : 'Quero conhecer o Norte' }}
              </button>
            </div>
          </form>
        }
      </div>
    </main>
  `,
})
export class InstitutionInterestComponent {
  private api = inject(ApiService);

  enviado = signal(false);
  enviando = signal(false);
  erro = signal<string | null>(null);

  form = {
    nomeInstituicao: '',
    tipo: '',
    responsavelNome: '',
    responsavelEmail: '',
    telefone: '',
    quantidadePessoas: null as number | null,
    mensagem: '',
  };

  enviar() {
    this.enviando.set(true);
    this.erro.set(null);

    this.api.post('/institution-interest', this.form).subscribe({
      next: () => {
        this.enviado.set(true);
        this.enviando.set(false);
      },
      error: (err) => {
        this.erro.set(err?.error?.error || 'Não foi possível enviar sua solicitação. Tente novamente.');
        this.enviando.set(false);
      },
    });
  }
}
