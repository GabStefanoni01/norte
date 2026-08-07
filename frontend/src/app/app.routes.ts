import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'politica-de-privacidade',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicyComponent),
  },
  {
    path: 'termos-de-uso',
    loadComponent: () => import('./pages/terms/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: 'aceite-termos',
    loadComponent: () =>
      import('./pages/accept-terms/accept-terms.component').then((m) => m.AcceptTermsComponent),
  },
  {
    path: 'sobre',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'contato',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'entrar',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'verificar-email',
    loadComponent: () => import('./pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
  },
  {
    path: 'esqueci-senha',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'redefinir-senha',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
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
    path: 'descoberta',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/discovery/discovery.component').then((m) => m.DiscoveryComponent),
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
    path: 'carreira',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/career/career.component').then((m) => m.CareerComponent),
  },
  {
    path: 'comunidade/novo',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/community/community-create.component').then((m) => m.CommunityCreateComponent),
  },
  {
    path: 'comunidade/:id',
    loadComponent: () => import('./pages/community/community-post.component').then((m) => m.CommunityPostComponent),
  },
  {
    path: 'comunidade',
    loadComponent: () => import('./pages/community/community.component').then((m) => m.CommunityComponent),
  },
  {
    path: 'curriculo',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/resume/resume.component').then((m) => m.ResumeComponent),
  },
  {
    path: 'conquistas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/achievements/achievements.component').then((m) => m.AchievementsComponent),
  },
  {
    path: 'oportunidades',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/opportunities/opportunities.component').then((m) => m.OpportunitiesComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
