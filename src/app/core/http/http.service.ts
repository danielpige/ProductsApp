import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/environment.token';

export type HttpQuery = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class HttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl: string = inject(API_BASE_URL);

  get<T>(path: string, query?: HttpQuery, headers?: HttpHeaders): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(query), headers });
  }

  post<T>(path: string, body: unknown, query?: HttpQuery, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(this.url(path), body, { params: this.toParams(query), headers });
  }

  put<T>(path: string, body: unknown, query?: HttpQuery, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(this.url(path), body, { params: this.toParams(query), headers });
  }

  delete<T>(path: string, query?: HttpQuery, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(this.url(path), { params: this.toParams(query), headers });
  }

  private url(path: string): string {
    // asegura slash correcto
    const base = this.baseUrl.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  private toParams(query?: HttpQuery): HttpParams | undefined {
    if (!query) return undefined;

    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      params = params.set(k, String(v));
    });
    return params;
  }
}
