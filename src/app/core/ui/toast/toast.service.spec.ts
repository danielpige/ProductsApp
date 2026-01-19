import { TestBed } from '@angular/core/testing';
import { ToastService, ToastMessage } from './toast.service';

describe('ToastService (Jest)', () => {
  let service: ToastService;

  // Helper para leer el último valor del observable sin async
  function readToastsSync(): ToastMessage[] {
    let latest: ToastMessage[] = [];
    const sub = service.toasts$.subscribe((v) => (latest = v));
    sub.unsubscribe();
    return latest;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });

    service = TestBed.inject(ToastService);

    jest.useFakeTimers();

    // Asegura que randomUUID sea mockeable
    if (!globalThis.crypto) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).crypto = {};
    }

    if (typeof globalThis.crypto.randomUUID !== 'function') {
      // Si no existe en tu runtime, lo creamos como jest.fn
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis.crypto as any).randomUUID = jest.fn();
    } else {
      // Si existe, lo convertimos en spy para poder controlar el retorno
      jest.spyOn(globalThis.crypto, 'randomUUID');
    }
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('debe iniciar con lista vacía', () => {
    expect(readToastsSync()).toEqual([]);
  });

  it('show(): debe agregar un toast al inicio con id generado y agendar auto-dismiss', () => {
    (globalThis.crypto.randomUUID as unknown as jest.Mock).mockReturnValueOnce('uuid-1');

    const setTimeoutSpy = jest.spyOn(window, 'setTimeout');

    service.show('success', 'Ok', 'Detalle');

    const list = readToastsSync();
    expect(list.length).toBe(1);
    expect(list[0]).toEqual({
      id: 'uuid-1',
      type: 'success',
      title: 'Ok',
      detail: 'Detalle',
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    const [, delay] = setTimeoutSpy.mock.calls[0];
    expect(delay).toBe(3500);
  });

  it('show(): debe apilar (prepend) el nuevo toast sobre los existentes', () => {
    (globalThis.crypto.randomUUID as unknown as jest.Mock)
      .mockReturnValueOnce('uuid-1')
      .mockReturnValueOnce('uuid-2');

    service.show('info', 'Primero');
    service.show('error', 'Segundo');

    const list = readToastsSync();
    expect(list.map((t) => t.id)).toEqual(['uuid-2', 'uuid-1']); // prepend
    expect(list[0].title).toBe('Segundo');
    expect(list[1].title).toBe('Primero');
  });

  it('dismiss(): debe eliminar el toast por id', () => {
    (globalThis.crypto.randomUUID as unknown as jest.Mock)
      .mockReturnValueOnce('uuid-1')
      .mockReturnValueOnce('uuid-2');

    service.show('success', 'A');
    service.show('error', 'B');

    expect(readToastsSync().map((t) => t.id)).toEqual(['uuid-2', 'uuid-1']);

    service.dismiss('uuid-2');
    expect(readToastsSync().map((t) => t.id)).toEqual(['uuid-1']);
  });

  it('dismiss(): si el id no existe, no debe cambiar la lista', () => {
    (globalThis.crypto.randomUUID as unknown as jest.Mock).mockReturnValueOnce('uuid-1');

    service.show('success', 'A');
    const before = readToastsSync();

    service.dismiss('no-existe');
    const after = readToastsSync();

    expect(after).toEqual(before);
  });

  it('auto-dismiss: después de 3500ms debe llamar dismiss() y remover el toast', () => {
    (globalThis.crypto.randomUUID as unknown as jest.Mock).mockReturnValueOnce('uuid-1');

    const dismissSpy = jest.spyOn(service, 'dismiss');

    service.show('info', 'Temporal');

    jest.advanceTimersByTime(3499);
    expect(readToastsSync().length).toBe(1);
    expect(dismissSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(dismissSpy).toHaveBeenCalledTimes(1);
    expect(dismissSpy).toHaveBeenCalledWith('uuid-1');
    expect(readToastsSync().length).toBe(0);
  });

  it('debe emitir cambios por toasts$ al hacer show y dismiss', () => {
    (globalThis.crypto.randomUUID as unknown as jest.Mock).mockReturnValueOnce('uuid-1');

    const emissions: ToastMessage[][] = [];
    const sub = service.toasts$.subscribe((v) => emissions.push(v));

    expect(emissions[0]).toEqual([]);

    service.show('success', 'Hola');
    expect(emissions[emissions.length - 1].length).toBe(1);

    service.dismiss('uuid-1');
    expect(emissions[emissions.length - 1]).toEqual([]);

    sub.unsubscribe();
  });
});
