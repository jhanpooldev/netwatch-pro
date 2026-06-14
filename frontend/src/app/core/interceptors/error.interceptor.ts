import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Global HTTP Error Intercepted:', error);

      if (error.status === 401) {
        // Token vencido o inexistente, desloguear y redirigir
        authService.logout();
      } else if (error.status === 403) {
        // Acceso prohibido por falta de roles
        console.warn('Acceso prohibido para el usuario actual');
      }

      // Propagar el error para que los componentes puedan manejar mensajes específicos si lo necesitan
      return throwError(() => error);
    })
  );
};
