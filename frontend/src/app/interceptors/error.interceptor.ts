import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { SnackbarService } from '../services/snackbar';

function resolveMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const apiMessage = (err.error && (err.error.message || err.error.error)) as string | undefined;
    if (apiMessage) return apiMessage;
    if (err.status === 0) return 'Server not reachable. Check backend and network.';
    if (err.status >= 500) return 'Server error. Please try again.';
    return err.message || 'Request failed.';
  }

  return 'Request failed.';
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackbar = inject(SnackbarService);

  return next(request).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        console.error('HTTP Error:', err.status, err.statusText, err.url);
        
        if (err.status !== 401) {
          const msg = resolveMessage(err);
          if (msg && !request.url.includes('/api/fines/')) {
            console.warn('Showing error snackbar:', msg);
          }
        }
      } else {
        console.error('Non-HTTP Error:', err);
      }
      return throwError(() => err);
    })
  );
};
