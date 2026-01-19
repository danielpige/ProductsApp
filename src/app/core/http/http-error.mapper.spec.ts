import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorMapper } from './http-error.mapper';
import { AppError } from '../errors/app-error';

describe('HttpErrorMapper', () => {
  function httpErr(params: {
    status: number;
    error?: any;
    statusText?: string;
    url?: string;
  }): HttpErrorResponse {
    return new HttpErrorResponse({
      status: params.status,
      statusText: params.statusText ?? 'ERR',
      url: params.url ?? '/api/test',
      error: params.error,
    });
  }

  it('si NO es HttpErrorResponse: retorna UNKNOWN genérico', () => {
    const res = HttpErrorMapper.toAppError('boom') as AppError;

    expect(res).toEqual({
      code: 'UNKNOWN',
      message: 'Ocurrió un error inesperado.',
    });
  });

  it('status=0: retorna NETWORK con detail y status', () => {
    const res = HttpErrorMapper.toAppError(httpErr({ status: 0 })) as AppError;

    expect(res).toEqual({
      code: 'NETWORK',
      message: 'No se pudo conectar al servidor.',
      detail: 'Verifica red / CORS / backend activo.',
      status: 0,
    });
  });

  describe('extrae serverMessage', () => {
    it('desde err.error.message (objeto)', () => {
      const res = HttpErrorMapper.toAppError(
        httpErr({ status: 400, error: { message: 'Mensaje del server' } }),
      );

      expect(res).toEqual({
        code: 'BAD_REQUEST',
        message: 'Mensaje del server',
        status: 400,
      });
    });

    it('si err.error.message viene vacío/espacios -> usa fallback', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 404, error: { message: '   ' } }));

      expect(res).toEqual({
        code: 'NOT_FOUND',
        message: 'No encontrado.',
        status: 404,
      });
    });

    it('desde err.error string (trim)', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 409, error: '  Conflicto  ' }));

      expect(res).toEqual({
        code: 'CONFLICT',
        message: 'Conflicto',
        status: 409,
      });
    });

    it('si err.error string vacío -> usa fallback', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 401, error: '   ' }));

      expect(res).toEqual({
        code: 'UNAUTHORIZED',
        message: 'No autorizado.',
        status: 401,
      });
    });
  });

  describe('mapeo por status', () => {
    it('400 -> BAD_REQUEST (fallback si no hay serverMessage)', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 400, error: {} }));

      expect(res).toEqual({
        code: 'BAD_REQUEST',
        message: 'Solicitud inválida.',
        status: 400,
      });
    });

    it('401 -> UNAUTHORIZED', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 401, error: {} }));

      expect(res).toEqual({
        code: 'UNAUTHORIZED',
        message: 'No autorizado.',
        status: 401,
      });
    });

    it('403 -> FORBIDDEN', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 403, error: {} }));

      expect(res).toEqual({
        code: 'FORBIDDEN',
        message: 'Acceso denegado.',
        status: 403,
      });
    });

    it('404 -> NOT_FOUND', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 404, error: {} }));

      expect(res).toEqual({
        code: 'NOT_FOUND',
        message: 'No encontrado.',
        status: 404,
      });
    });

    it('409 -> CONFLICT', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 409, error: {} }));

      expect(res).toEqual({
        code: 'CONFLICT',
        message: 'Conflicto de datos.',
        status: 409,
      });
    });

    it('>=500 -> SERVER (usa serverMessage si viene)', () => {
      const res = HttpErrorMapper.toAppError(
        httpErr({ status: 503, error: { message: 'Downstream caído' } }),
      );

      expect(res).toEqual({
        code: 'SERVER',
        message: 'Downstream caído',
        status: 503,
      });
    });

    it('status no contemplado y <500 -> UNKNOWN con "Error HTTP {status}."', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 418, error: {} }));

      expect(res).toEqual({
        code: 'UNKNOWN',
        message: 'Error HTTP 418.',
        status: 418,
      });
    });

    it('status no contemplado y <500 pero con serverMessage -> UNKNOWN con serverMessage', () => {
      const res = HttpErrorMapper.toAppError(httpErr({ status: 418, error: 'Soy una tetera' }));

      expect(res).toEqual({
        code: 'UNKNOWN',
        message: 'Soy una tetera',
        status: 418,
      });
    });
  });
});
