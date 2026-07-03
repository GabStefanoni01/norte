import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado() && auth.ehAdmin()) {
    return true;
  }

  router.navigate(auth.estaAutenticado() ? ['/dashboard'] : ['/entrar']);
  return false;
};
