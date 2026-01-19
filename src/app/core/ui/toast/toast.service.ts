import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this._toasts.asObservable();

  show(type: ToastType, title: string, detail?: string): void {
    const toast: ToastMessage = { id: crypto.randomUUID(), type, title, detail };
    this._toasts.next([toast, ...this._toasts.value]);

    window.setTimeout(() => this.dismiss(toast.id), 3500);
  }

  dismiss(id: string): void {
    this._toasts.next(this._toasts.value.filter((t) => t.id !== id));
  }
}
