import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { StarfieldComponent } from '../../components/starfield/starfield.component';
import { LogoMarkComponent } from '../../components/logo-mark/logo-mark.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'norte-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, StarfieldComponent, LogoMarkComponent, FooterComponent],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

  enviando = signal(false);
  sucesso = signal<string | null>(null);
  erro = signal<string | null>(null);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    mensagem: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(2000)]],
  });

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.sucesso.set(null);
    this.enviando.set(true);

    const valores = this.form.getRawValue();

    this.contactService
      .enviar({ nome: valores.nome!, email: valores.email!, mensagem: valores.mensagem! })
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.sucesso.set(res.message);
          this.form.reset();
        },
        error: (err) => {
          this.enviando.set(false);
          this.erro.set(err?.error?.error ?? 'Não foi possível enviar sua mensagem. Tente novamente.');
        },
      });
  }
}
