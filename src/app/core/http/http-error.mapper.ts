import { HttpErrorResponse } from '@angular/common/http';
import { AppError } from '../errors/app-error';

export class HttpErrorMapper {
  static toAppError(err: unknown): AppError {
    if (!(err instanceof HttpErrorResponse)) {
      return { code: 'UNKNOWN', message: 'Ocurrió un error inesperado.' };
    }

    if (err.status === 0) {
      return {
        code: 'NETWORK',
        message: 'No se pudo conectar al servidor.',
        detail: 'Verifica red / CORS / backend activo.',
        status: 0,
      };
    }

    const serverMessage = HttpErrorMapper.extractServerMessage(err);

    switch (err.status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: serverMessage ?? 'Solicitud inválida.',
          status: 400,
        };
      case 401:
        return { code: 'UNAUTHORIZED', message: serverMessage ?? 'No autorizado.', status: 401 };
      case 403:
        return { code: 'FORBIDDEN', message: serverMessage ?? 'Acceso denegado.', status: 403 };
      case 404:
        return { code: 'NOT_FOUND', message: serverMessage ?? 'No encontrado.', status: 404 };
      case 409:
        return { code: 'CONFLICT', message: serverMessage ?? 'Conflicto de datos.', status: 409 };
      default:
        if (err.status >= 500) {
          return {
            code: 'SERVER',
            message: serverMessage ?? 'Error del servidor.',
            status: err.status,
          };
        }
        return {
          code: 'UNKNOWN',
          message: serverMessage ?? `Error HTTP ${err.status}.`,
          status: err.status,
        };
    }
  }

  private static extractServerMessage(err: HttpErrorResponse): string | null {
    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = String((err.error as any).message ?? '');
      return msg.trim().length ? msg : null;
    }

    if (typeof err.error === 'string') {
      const msg = err.error.trim();
      return msg.length ? msg : null;
    }
    return null;
  }
}
