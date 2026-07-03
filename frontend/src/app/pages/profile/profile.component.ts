import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProfileService } from '../../services/profile.service';
import { INTERESSES_DISPONIVEIS, ESCOLARIDADES } from '../../models/profile.model';

@Component({
  selector: 'norte-profile',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  interessesDisponiveis = INTERESSES_DISPONIVEIS;
  escolaridades = ESCOLARIDADES;

  carregando = signal(true);
  salvando = signal(false);
  sucesso = signal<string | null>(null);
  erro = signal<string | null>(null);
  jaTemPerfil = signal(false);

  form = this.fb.group({
    escolaridade: ['', [Validators.required]],
    interesses: this.fb.array(
      this.interessesDisponiveis.map(() => this.fb.control(false))
    ),
    objetivos: ['', [Validators.required, Validators.minLength(5)]],
    habilidadesTexto: [''],
  });

  ngOnInit() {
    this.profileService.buscar().subscribe((perfil) => {
      if (perfil) {
        this.jaTemPerfil.set(true);
        this.form.patchValue({
          escolaridade: perfil.escolaridade,
          objetivos: perfil.objetivos,
          habilidadesTexto: (perfil.habilidades || []).join(', '),
        });

        const interesses = perfil.interesses || [];
        this.interessesDisponiveis.forEach((interesse, i) => {
          if (interesses.includes(interesse)) {
            this.interessesArray.at(i).setValue(true);
          }
        });
      }
      this.carregando.set(false);
    });
  }

  get interessesArray() {
    return this.form.get('interesses') as FormArray;
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.sucesso.set(null);
    this.salvando.set(true);

    const valores = this.form.getRawValue();
    const interesses = this.interessesDisponiveis.filter((_, i) => valores.interesses[i]);
    const habilidades = (valores.habilidadesTexto || '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    this.profileService
      .salvar({
        escolaridade: valores.escolaridade!,
        interesses,
        objetivos: valores.objetivos!,
        habilidades,
      })
      .subscribe({
        next: () => {
          this.salvando.set(false);
          if (this.jaTemPerfil()) {
            this.sucesso.set('Perfil atualizado com sucesso.');
          } else {
            this.router.navigate(['/descoberta']);
          }
        },
        error: () => {
          this.salvando.set(false);
          this.erro.set('Não foi possível salvar seu perfil. Tente novamente.');
        },
      });
  }
}
