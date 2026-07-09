import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

const NORTE_API_URL = 'http://localhost:3000';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Só anexa o token em chamadas para a própria API do Norte — chamadas a
  // serviços externos (ex: API de localidades do IBGE) não devem recebê-lo.
  if (!token || !req.url.startsWith(NORTE_API_URL)) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};
