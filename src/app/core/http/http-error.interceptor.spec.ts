import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';

import { HttpErrorInterceptor } from './http-error.interceptor';
import { ToastService } from '../ui/toast/toast.service';
import { HttpErrorMapper } from './http-error.mapper';
import { AppError } from '../errors/app-error';

describe('HttpErrorInterceptor (Jest)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const toast = { show: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        { provide: ToastService, useValue: toast },

        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),

        HttpErrorInterceptor,

        {
          provide: HTTP_INTERCEPTORS,
          useExisting: HttpErrorInterceptor,
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe dejar pasar la respuesta si no hay error (no muestra toast)', () => {
    const mapperSpy = jest.spyOn(HttpErrorMapper, 'toAppError');

    http.get('/api/ok').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    const req = httpMock.expectOne('/api/ok');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });

    expect(mapperSpy).not.toHaveBeenCalled();
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('cuando ocurre error: debe mapear a AppError, mostrar toast y re-lanzar AppError', (done) => {
    const mapped: AppError = { message: 'Mensaje mapeado' } as any;
    const mapperSpy = jest.spyOn(HttpErrorMapper, 'toAppError').mockReturnValue(mapped);

    http.get('/api/fail').subscribe({
      next: () => done.fail('No debería emitir next'),
      error: (err) => {
        try {
          expect(err).toBe(mapped);

          expect(mapperSpy).toHaveBeenCalledTimes(1);
          const original = mapperSpy.mock.calls[0][0];
          expect(original).toBeInstanceOf(HttpErrorResponse);

          expect(toast.show).toHaveBeenCalledTimes(1);
          expect(toast.show).toHaveBeenCalledWith('error', 'Error', 'Mensaje mapeado');

          done();
        } catch (e) {
          done(e);
        }
      },
    });

    const req = httpMock.expectOne('/api/fail');
    req.flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });
  });

  it('debe manejar errores no-HTTP igualmente (mapper recibe el error tal cual)', (done) => {
    const mapped: AppError = { message: 'Error desde mapper' } as any;
    const mapperSpy = jest.spyOn(HttpErrorMapper, 'toAppError').mockReturnValue(mapped);

    const interceptor = TestBed.inject(HttpErrorInterceptor);

    const next = {
      handle: () =>
        new Observable((sub) => {
          sub.error('STRING_ERROR');
        }),
    };

    interceptor.intercept({} as any, next as any).subscribe({
      next: () => done.fail('No debería emitir next'),
      error: (err) => {
        try {
          expect(mapperSpy).toHaveBeenCalledWith('STRING_ERROR');
          expect(toast.show).toHaveBeenCalledWith('error', 'Error', 'Error desde mapper');
          expect(err).toBe(mapped);
          done();
        } catch (e) {
          done(e);
        }
      },
    });
  });
});
