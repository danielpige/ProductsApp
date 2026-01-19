import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastVM {
  id: string;
  type: ToastType;
  title: string;
  detail?: string | null;
}

describe('ToastComponent (Jest)', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let component: ToastComponent;

  // Mock service
  let toasts$: BehaviorSubject<ToastVM[]>;
  let toastService: { toasts$: any; dismiss: jest.Mock };

  const detect = () => {
    fixture.detectChanges();
  };

  beforeEach(() => {
    toasts$ = new BehaviorSubject<ToastVM[]>([]);
    toastService = {
      toasts$: toasts$.asObservable(),
      dismiss: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [ToastComponent],
      providers: [{ provide: ToastService, useValue: toastService }],
    })
      // Mantiene OnPush tal cual; no lo sobreescribimos.
      .compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    detect();
    expect(component).toBeTruthy();
  });

  it('debe renderizar el contenedor stack con atributos aria', () => {
    detect();

    const stack = fixture.debugElement.query(By.css('.toast-stack'))?.nativeElement as HTMLElement;
    expect(stack).toBeTruthy();
    expect(stack.getAttribute('aria-live')).toBe('polite');
    expect(stack.getAttribute('aria-relevant')).toBe('additions');
  });

  it('debe renderizar 0 toasts cuando el stream está vacío', () => {
    detect();

    const items = fixture.debugElement.queryAll(By.css('.toast'));
    expect(items.length).toBe(0);
  });

  it('debe renderizar toasts con title, type (data-type) y detail condicional', () => {
    const data: ToastVM[] = [
      { id: '1', type: 'success', title: 'Guardado', detail: 'Se guardó correctamente.' },
      { id: '2', type: 'error', title: 'Error', detail: '' }, // detail vacío -> no debe renderizarse
      { id: '3', type: 'info', title: 'Info' }, // sin detail -> no debe renderizarse
    ];

    toasts$.next(data);
    detect();

    const items = fixture.debugElement.queryAll(By.css('.toast'));
    expect(items.length).toBe(3);

    // Toast 1
    const t1 = items[0].nativeElement as HTMLElement;
    expect(t1.getAttribute('data-type')).toBe('success');
    expect(t1.querySelector('.toast__title')?.textContent).toContain('Guardado');
    expect(t1.querySelector('.toast__detail')?.textContent).toContain('Se guardó correctamente.');

    // Toast 2 (detail vacío => *ngIf false)
    const t2 = items[1].nativeElement as HTMLElement;
    expect(t2.getAttribute('data-type')).toBe('error');
    expect(t2.querySelector('.toast__title')?.textContent).toContain('Error');
    expect(t2.querySelector('.toast__detail')).toBeNull();

    // Toast 3 (sin detail)
    const t3 = items[2].nativeElement as HTMLElement;
    expect(t3.getAttribute('data-type')).toBe('info');
    expect(t3.querySelector('.toast__title')?.textContent).toContain('Info');
    expect(t3.querySelector('.toast__detail')).toBeNull();
  });

  it('al hacer click en cerrar debe llamar toast.dismiss con el id correcto', () => {
    toasts$.next([{ id: 'X1', type: 'error', title: 'Error', detail: 'Fallo' }]);
    detect();

    const closeBtn = fixture.debugElement.query(By.css('.toast__close'));
    closeBtn.triggerEventHandler('click', new MouseEvent('click'));
    detect();

    expect(toastService.dismiss).toHaveBeenCalledTimes(1);
    expect(toastService.dismiss).toHaveBeenCalledWith('X1');
  });

  it('debe actualizar el DOM cuando cambia el stream (async pipe)', () => {
    // Inicialmente 1 toast
    toasts$.next([{ id: '1', type: 'success', title: 'A' }]);
    detect();
    expect(fixture.debugElement.queryAll(By.css('.toast')).length).toBe(1);

    // Luego 2 toasts
    toasts$.next([
      { id: '1', type: 'success', title: 'A' },
      { id: '2', type: 'warning', title: 'B', detail: 'Detalle' },
    ]);
    detect();

    const items = fixture.debugElement.queryAll(By.css('.toast'));
    expect(items.length).toBe(2);

    const last = items[1].nativeElement as HTMLElement;
    expect(last.getAttribute('data-type')).toBe('warning');
    expect(last.querySelector('.toast__title')?.textContent).toContain('B');
    expect(last.querySelector('.toast__detail')?.textContent).toContain('Detalle');
  });
});
