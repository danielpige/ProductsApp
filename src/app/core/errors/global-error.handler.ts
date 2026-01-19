import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '../ui/toast/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toast = inject(ToastService);

  handleError(error: unknown): void {
    this.toast.show('error', 'Error inesperado', 'Ocurrió un problema. Intenta nuevamente.');

    console.error(error);
  }
}
