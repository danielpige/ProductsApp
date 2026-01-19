import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ToastService } from '../ui/toast/toast.service';
import { HttpErrorMapper } from './http-error.mapper';
import { AppError } from '../errors/app-error';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly toast = inject(ToastService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        const appError: AppError = HttpErrorMapper.toAppError(err);
        this.toast.show('error', 'Error', appError.message);
        return throwError(() => appError);
      }),
    );
  }
}
