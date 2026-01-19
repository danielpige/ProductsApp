import { FormControl } from '@angular/forms';
import { minTodayDateValidator } from './min-today-date.validator';

describe('minTodayDateValidator (comportamiento actual)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Fijamos "hoy" en Colombia (UTC-5)
    jest.setSystemTime(new Date('2026-01-19T12:00:00.000-05:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retorna null si el control no tiene valor', () => {
    expect(minTodayDateValidator(new FormControl(null))).toBeNull();
    expect(minTodayDateValidator(new FormControl(undefined))).toBeNull();
    expect(minTodayDateValidator(new FormControl(''))).toBeNull();
  });

  it('retorna null si la fecha es futura (YYYY-MM-DD)', () => {
    // "2026-01-20" parseado como UTC -> local sigue siendo 2026-01-19/20 según TZ,
    // pero siempre debe ser >= hoy en esta fecha fija.
    const control = new FormControl('2026-01-20');
    expect(minTodayDateValidator(control)).toBeNull();
  });

  it('retorna {minToday:true} si la fecha es anterior (YYYY-MM-DD)', () => {
    const control = new FormControl('2026-01-18');
    expect(minTodayDateValidator(control)).toEqual({ minToday: true });
  });

  it('en TZ negativa (ej: -05), "hoy" en formato YYYY-MM-DD suele evaluarse como anterior (bug esperado)', () => {
    // Debido a que new Date('YYYY-MM-DD') se interpreta en UTC, en UTC-5 cae el día anterior.
    const control = new FormControl('2026-01-19');
    expect(minTodayDateValidator(control)).toEqual({ minToday: true });
  });

  it('compara por día (ignora hora) si recibe ISO con hora en zona local -05', () => {
    // Este ISO está expresado en -05, por lo que al setHours(0) queda en el mismo día local.
    const sameDayLocal = new FormControl('2026-01-19T00:00:00.000-05:00');
    expect(minTodayDateValidator(sameDayLocal)).toBeNull();

    const prevDayLocal = new FormControl('2026-01-18T23:59:59.999-05:00');
    expect(minTodayDateValidator(prevDayLocal)).toEqual({ minToday: true });
  });

  it('si recibe un Date, compara por día ignorando la hora', () => {
    const sameDay = new FormControl(new Date('2026-01-19T23:59:59.999-05:00'));
    expect(minTodayDateValidator(sameDay)).toBeNull();

    const prevDay = new FormControl(new Date('2026-01-18T23:59:59.999-05:00'));
    expect(minTodayDateValidator(prevDay)).toEqual({ minToday: true });
  });
});
