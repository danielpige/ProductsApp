import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ToastService } from '../../../../core/ui/toast/toast.service';
import { VerifyIdentifierUseCase } from '../../../../domain/products/use-cases/verify-identifier.usecase';
import { CreateProductUseCase } from '../../../../domain/products/use-cases/create-product.usecase';
import { UpdateProductUseCase } from '../../../../domain/products/use-cases/update-product.usecase';
import { GetProductUseCase } from '../../../../domain/products/use-cases/get-product.usecase';
import { addYears, isValidUrl } from '../../../../core/utils/date.util';
import { Product } from '../../../../domain/products/entities/product.entity';

import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  first,
  map,
  Observable,
  of,
  switchMap,
  finalize,
} from 'rxjs';
import { minTodayDateValidator } from '../../../../core/validators/min-today-date.validator';

@Component({
  selector: 'app-produc-form',
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
export class ProductForm {
  private readonly destroyRef = inject(DestroyRef);

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly verifyId = inject(VerifyIdentifierUseCase);
  private readonly createProduct = inject(CreateProductUseCase);
  private readonly updateProduct = inject(UpdateProductUseCase);
  private readonly getProduct = inject(GetProductUseCase);

  readonly loading = signal<boolean>(false);

  private readonly id$ = this.route.paramMap.pipe(
    map((pm) => pm.get('id')),
    distinctUntilChanged(),
  );

  readonly idParam = signal<string | null>(null);
  readonly isEdit = computed(() => !!this.idParam());

  readonly form = this.fb.group({
    id: [
      '',
      {
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
        asyncValidators: [this.uniqueIdValidator()],
        updateOn: 'blur',
      },
    ],
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    logo: ['', [Validators.required, this.urlValidator]],
    dateRelease: [
      '',
      this.isEdit() ? [Validators.required] : [Validators.required, minTodayDateValidator],
    ],
    dateRevision: [{ value: '', disabled: true }, [Validators.required]],
  });

  readonly todayMin = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  constructor() {
    this.id$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      this.idParam.set(id);

      if (id) {
        this.prefill(id);
      } else {
        this.form.get('id')!.enable({ emitEvent: false });
      }
    });

    this.form
      .get('dateRelease')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        const date = v ? new Date(v) : null;
        this.form
          .get('dateRevision')!
          .setValue(date ? this.formatDate(addYears(date, 1)) : '', { emitEvent: false });
      });
  }

  private prefill(id: string): void {
    this.loading.set(true);

    this.getProduct
      .execute(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (p) => {
          this.form.patchValue(
            {
              id: p.id,
              name: p.name,
              description: p.description,
              logo: p.logo,
              dateRelease: this.formatDate(p.dateRelease),
              dateRevision: this.formatDate(p.dateRevision),
            },
            { emitEvent: false },
          );

          // id no se cambia en edición
          this.form.get('id')!.disable({ emitEvent: false });
        },
        // errores HTTP ya se muestran con interceptor global
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('error', 'Revisa el formulario', 'Hay campos inválidos o incompletos.');
      return;
    }

    const raw = this.form.getRawValue();
    const product: Product = {
      id: String(raw.id),
      name: String(raw.name),
      description: String(raw.description),
      logo: String(raw.logo),
      dateRelease: new Date(String(raw.dateRelease)),
      dateRevision: new Date(String(raw.dateRevision)),
    };

    this.loading.set(true);

    const op$ = this.isEdit()
      ? this.updateProduct.execute(product)
      : this.createProduct.execute(product);

    op$
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.show('success', this.isEdit() ? 'Producto actualizado' : 'Producto creado');
          this.router.navigate(['/products']);
        },
      });
  }

  resetForm(): void {
    this.form.reset();
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }

  // --- Validators ---
  private urlValidator(control: AbstractControl): ValidationErrors | null {
    const v = String(control.value ?? '');
    return isValidUrl(v) ? null : { url: true };
  }

  private uniqueIdValidator(): AsyncValidatorFn {
    return (control): Observable<ValidationErrors | null> => {
      if (this.isEdit()) return of(null);

      const v = String(control.value ?? '').trim();
      if (!v) return of(null);

      return of(v).pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((id) => this.verifyId.execute(id)),
        map((exists) => (exists ? { duplicate: true } : null)),
        catchError(() => of(null)),
        first(),
      );
    };
  }

  private formatDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  fieldError(name: string): string | null {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return null;

    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['minlength']) return 'Longitud mínima no alcanzada.';
    if (c.errors['maxlength']) return 'Longitud máxima excedida.';
    if (c.errors['url']) return 'Debe ser una URL válida.';
    if (c.errors['duplicate']) return 'El identificador ya existe.';
    return 'Campo inválido.';
  }
}
