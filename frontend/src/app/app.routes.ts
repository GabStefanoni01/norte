import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'plano',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/plans/plans.component').then((m) => m.PlansComponent),
  },
  {
    path: 'oportunidades',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/opportunities/opportunities.component').then((m) => m.OpportunitiesComponent),
  },
  { path: '**', redirectTo: '' },
];
