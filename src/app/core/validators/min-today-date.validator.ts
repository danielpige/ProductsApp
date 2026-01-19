import { AbstractControl, ValidationErrors } from '@angular/forms';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function minTodayDateValidator(control: AbstractControl): ValidationErrors | null {
  const raw = control.value;
  if (!raw) return null;

  const selected = new Date(String(raw));
  selected.setHours(0, 0, 0, 0);

  return selected >= startOfToday() ? null : { minToday: true };
}
