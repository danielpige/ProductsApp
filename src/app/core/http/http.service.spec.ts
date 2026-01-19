import { TestBed } from '@angular/core/testing';
import { HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HttpService, HttpQuery } from './http.service';
import { API_BASE_URL } from '../config/environment.token';

describe('HttpService (Jest)', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),

        { provide: API_BASE_URL, useValue: 'https://api.example.com/' },

        HttpService,
      ],
    });

    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('url()', () => {
    it('debe normalizar el baseUrl (sin slash final) y el path (con slash inicial)', () => {
      service.get('/products').subscribe();
      const req1 = httpMock.expectOne('https://api.example.com/products');
      req1.flush(null);

      service.get('products').subscribe();
      const req2 = httpMock.expectOne('https://api.example.com/products');
      req2.flush(null);
    });

    it('si baseUrl tiene múltiples slashes finales, debe removerlos', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: 'https://api.example.com////' },
          HttpService,
        ],
      });

      const s = TestBed.inject(HttpService);
      const hm = TestBed.inject(HttpTestingController);

      s.get('ping').subscribe();
      const req = hm.expectOne('https://api.example.com/ping');
      req.flush(null);

      hm.verify();
    });
  });

  describe('toParams()', () => {
    it('debe convertir query a HttpParams (stringify) y omitir null/undefined', () => {
      const query: HttpQuery = {
        a: 'x',
        b: 10,
        c: true,
        d: null,
        e: undefined,
      };

      service.get('/q', query).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'https://api.example.com/q');
      expect(req.request.method).toBe('GET');

      // OJO: HttpParams serializa a string con toString()
      expect(req.request.params.toString()).toBe('a=x&b=10&c=true');

      req.flush({ ok: true });
    });

    it('si no se pasa query, no debe enviar params', () => {
      service.get('/no-params').subscribe();

      const req = httpMock.expectOne('https://api.example.com/no-params');
      expect(req.request.params.keys().length).toBe(0);

      req.flush({ ok: true });
    });
  });

  describe('headers', () => {
    it('debe enviar headers si se proveen', () => {
      const headers = new HttpHeaders({
        Authorization: 'Bearer TOKEN',
        'X-Custom': '123',
      });

      service.get('/headers', undefined, headers).subscribe();

      const req = httpMock.expectOne('https://api.example.com/headers');
      expect(req.request.headers.get('Authorization')).toBe('Bearer TOKEN');
      expect(req.request.headers.get('X-Custom')).toBe('123');

      req.flush({ ok: true });
    });
  });

  describe('HTTP verbs', () => {
    it('GET: debe llamar http.get con url, params y headers', () => {
      service.get('/products', { page: 1 }).subscribe();

      const req = httpMock.expectOne('https://api.example.com/products?page=1');
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();

      req.flush([{ id: 1 }]);
    });

    it('POST: debe enviar body + query', () => {
      const body = { name: 'A' };

      service.post('/products', body, { dryRun: true }).subscribe();

      const req = httpMock.expectOne('https://api.example.com/products?dryRun=true');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);

      req.flush({ id: 'X' });
    });

    it('PUT: debe enviar body + query', () => {
      const body = { name: 'B' };

      service.put('/products/1', body, { force: 1 }).subscribe();

      const req = httpMock.expectOne('https://api.example.com/products/1?force=1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);

      req.flush({ ok: true });
    });

    it('DELETE: debe enviar query (sin body)', () => {
      service.delete('/products/1', { hard: false }).subscribe();

      const req = httpMock.expectOne('https://api.example.com/products/1?hard=false');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toBeNull();

      req.flush({ ok: true });
    });
  });
});
