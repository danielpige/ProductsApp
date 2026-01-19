import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { ProductForm } from './product-form';

import { ToastService } from '../../../../core/ui/toast/toast.service';
import { VerifyIdentifierUseCase } from '../../../../domain/products/use-cases/verify-identifier.usecase';
import { CreateProductUseCase } from '../../../../domain/products/use-cases/create-product.usecase';
import { UpdateProductUseCase } from '../../../../domain/products/use-cases/update-product.usecase';
import { GetProductUseCase } from '../../../../domain/products/use-cases/get-product.usecase';
import { Product } from '../../../../domain/products/entities/product.entity';

@Component({
  selector: 'app-skeleton',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  template: '<div data-testid="skeleton">skeleton {{ rows }}</div>',
})
class SkeletonStubComponent {
  @Input() rows = 0;
}

describe('ProductForm (Jest)', () => {
  let fixture: ComponentFixture<ProductForm>;
  let component: ProductForm;

  let router: { navigate: jest.Mock };
  let toast: { show: jest.Mock };

  let verifyId: { execute: jest.Mock<Observable<boolean>, [string]> };
  let createProduct: { execute: jest.Mock<Observable<unknown>, [Product]> };
  let updateProduct: { execute: jest.Mock<Observable<unknown>, [Product]> };
  let getProduct: { execute: jest.Mock<Observable<Product>, [string]> };

  let paramMap$: BehaviorSubject<ParamMap>;

  function setup(
    initialId: string | null = null,
    overrides?: {
      getProduct$?: Observable<Product>;
      verifyId$?: Observable<boolean>;
      create$?: Observable<unknown>;
      update$?: Observable<unknown>;
    },
  ) {
    paramMap$ = new BehaviorSubject<ParamMap>(
      convertToParamMap(initialId ? { id: initialId } : {}),
    );

    router = { navigate: jest.fn() };
    toast = { show: jest.fn() };

    verifyId = { execute: jest.fn() as any };
    createProduct = { execute: jest.fn() as any };
    updateProduct = { execute: jest.fn() as any };
    getProduct = { execute: jest.fn() as any };

    // Defaults seguros
    verifyId.execute.mockReturnValue((overrides?.verifyId$ ?? of(false)) as any);
    createProduct.execute.mockReturnValue((overrides?.create$ ?? of(void 0)) as any);
    updateProduct.execute.mockReturnValue((overrides?.update$ ?? of(void 0)) as any);
    getProduct.execute.mockReturnValue((overrides?.getProduct$ ?? of(null as any)) as any);

    TestBed.configureTestingModule({
      declarations: [ProductForm, SkeletonStubComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: VerifyIdentifierUseCase, useValue: verifyId },
        { provide: CreateProductUseCase, useValue: createProduct },
        { provide: UpdateProductUseCase, useValue: updateProduct },
        { provide: GetProductUseCase, useValue: getProduct },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
      ],
    });

    fixture = TestBed.createComponent(ProductForm);
    component = fixture.componentInstance;
  }

  function q<T extends HTMLElement = HTMLElement>(selector: string): T {
    const el = fixture.nativeElement.querySelector(selector);
    if (!el) throw new Error(`No se encontró selector: ${selector}`);
    return el as T;
  }

  function setInputByControlName(controlName: string, value: string) {
    const input = q<HTMLInputElement | HTMLTextAreaElement>(`[formcontrolname="${controlName}"]`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return input;
  }

  function blur(el: HTMLElement) {
    el.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  // Helper: estabiliza cambios y repinta.
  function stabilize(ms = 0) {
    if (ms > 0) tick(ms);
    tick();
    fixture.detectChanges();
  }

  it('debe renderizar el título "Nuevo producto" cuando no hay id en ruta', () => {
    setup(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nuevo producto');
    expect(component.isEdit()).toBe(false);
  });

  it('debe renderizar el título "Editar producto" cuando hay id en ruta y pedir el producto', fakeAsync(() => {
    // Usar hora al mediodía en Z para evitar desplazamientos por TZ en tests.
    const mockProduct: Product = {
      id: 'ABC123',
      name: 'Producto X',
      description: 'Desc',
      logo: 'https://example.com/logo.png',
      dateRelease: new Date('2026-03-01T12:00:00.000Z'),
      dateRevision: new Date('2027-03-01T12:00:00.000Z'),
    };

    setup('ABC123', { getProduct$: of(mockProduct) });
    fixture.detectChanges();
    stabilize();

    expect(fixture.nativeElement.textContent).toContain('Editar producto');
    expect(component.isEdit()).toBe(true);
    expect(getProduct.execute).toHaveBeenCalledWith('ABC123');
  }));

  it('debe mostrar skeleton cuando loading=true', () => {
    setup(null);
    fixture.detectChanges();

    component.loading.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="skeleton"]')).toBeTruthy();
    // cuando loading, no debe existir el form
    expect(fixture.nativeElement.querySelector('form')).toBeFalsy();
  });

  it('en modo edición debe prellenar el formulario y deshabilitar el campo id', fakeAsync(() => {
    const mockProduct: Product = {
      id: 'P-001',
      name: 'Prod',
      description: 'Desc larga',
      logo: 'https://example.com/a.png',
      dateRelease: new Date('2026-04-10T12:00:00.000Z'),
      dateRevision: new Date('2027-04-10T12:00:00.000Z'),
    };

    setup('P-001', { getProduct$: of(mockProduct) });
    fixture.detectChanges();
    stabilize();

    expect(component.form.get('id')!.disabled).toBe(true);

    expect(component.form.get('id')!.value).toBe('P-001');
    expect(component.form.get('name')!.value).toBe('Prod');
    expect(component.form.get('description')!.value).toBe('Desc larga');
    expect(component.form.get('logo')!.value).toBe('https://example.com/a.png');

    // formatDate(Date) => YYYY-MM-DD (con Date al mediodía evitamos off-by-one)
    expect(component.form.get('dateRelease')!.value).toBe('2026-04-10');
    expect(component.form.get('dateRevision')!.value).toBe('2027-04-10');
  }));

  it('debe recalcular dateRevision = dateRelease + 1 año al cambiar dateRelease', fakeAsync(() => {
    setup(null);
    fixture.detectChanges();

    // Importante: para que el validator minToday no genere falsos negativos por TZ,
    // usamos un ISO con hora al mediodía.
    component.form.get('dateRelease')!.setValue('2030-01-15T12:00:00.000Z');
    stabilize();

    expect(component.form.get('dateRevision')!.value).toBe('2031-01-15');
  }));

  it('submit inválido: debe marcar touched y mostrar toast error, sin navegar ni ejecutar casos de uso', () => {
    setup(null);
    fixture.detectChanges();

    component.submit();
    fixture.detectChanges();

    expect(toast.show).toHaveBeenCalledWith(
      'error',
      'Revisa el formulario',
      'Hay campos inválidos o incompletos.',
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(createProduct.execute).not.toHaveBeenCalled();
    expect(updateProduct.execute).not.toHaveBeenCalled();
  });

  it('submit create válido: debe llamar CreateProductUseCase y navegar a /products con toast success', fakeAsync(() => {
    setup(null, { create$: of(void 0), verifyId$: of(false) });
    fixture.detectChanges();

    // Rellenar por DOM para disparar updateOn: 'blur' del id.
    const idInput = setInputByControlName('id', 'PROD-123');
    blur(idInput);
    stabilize(220); // debounce 200ms + margen

    setInputByControlName('name', 'Nombre válido');
    setInputByControlName('description', 'Descripción válida');
    setInputByControlName('logo', 'https://example.com/logo.png');

    // Usar mediodía para evitar falsos negativos del minTodayDateValidator.
    const releaseIsoMidday = `${component.todayMin}T12:00:00.000Z`;
    component.form.get('dateRelease')!.setValue(releaseIsoMidday);
    stabilize();

    expect(component.form.get('dateRevision')!.value).toBeTruthy();

    component.form.markAllAsTouched();
    component.form.updateValueAndValidity();
    stabilize();

    expect(component.form.invalid).toBe(false);

    component.submit();
    stabilize();

    expect(createProduct.execute).toHaveBeenCalledTimes(1);
    const arg: Product = createProduct.execute.mock.calls[0][0];

    expect(arg.id).toBe('PROD-123');
    expect(arg.name).toBe('Nombre válido');
    expect(arg.description).toBe('Descripción válida');
    expect(arg.logo).toBe('https://example.com/logo.png');
    expect(arg.dateRelease instanceof Date).toBe(true);
    expect(arg.dateRevision instanceof Date).toBe(true);

    expect(toast.show).toHaveBeenCalledWith('success', 'Producto creado');
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  }));

  it('submit edit válido: debe llamar UpdateProductUseCase y navegar a /products con toast success', fakeAsync(() => {
    const mockProduct: Product = {
      id: 'EDIT-1',
      name: 'Prod',
      description: 'Desc ok', // <-- minLength(5)
      logo: 'https://example.com/logo.png',
      dateRelease: new Date('2030-03-01T12:00:00.000Z'),
      dateRevision: new Date('2031-03-01T12:00:00.000Z'),
    };

    setup('EDIT-1', { getProduct$: of(mockProduct), update$: of(void 0) });
    fixture.detectChanges();
    stabilize();

    // Prefill deja todo, solo cambiamos name
    component.form.get('name')!.setValue('Prod actualizado');
    stabilize();

    component.form.updateValueAndValidity();
    stabilize();

    expect(component.form.invalid).toBe(false);

    component.submit();
    stabilize();

    expect(updateProduct.execute).toHaveBeenCalledTimes(1);

    const arg: Product = updateProduct.execute.mock.calls[0][0];
    expect(arg.id).toBe('EDIT-1');
    expect(arg.name).toBe('Prod actualizado');

    expect(toast.show).toHaveBeenCalledWith('success', 'Producto actualizado');
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  }));

  it('cancel(): debe navegar a /products', () => {
    setup(null);
    fixture.detectChanges();

    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('resetForm(): debe limpiar el formulario', () => {
    setup(null);
    fixture.detectChanges();

    component.form.patchValue({
      id: 'A',
      name: 'BBB',
      description: 'CCCCC',
      logo: 'https://example.com/x',
      dateRelease: '2030-01-01T12:00:00.000Z',
    });

    component.resetForm();
    expect(component.form.get('name')!.value).toBeNull();
    expect(component.form.get('id')!.value).toBeNull();
  });

  it('uniqueIdValidator: en create debe marcar duplicate si verifyId devuelve true (con blur + debounce)', fakeAsync(() => {
    setup(null, { verifyId$: of(true) });
    fixture.detectChanges();

    const idInput = setInputByControlName('id', 'DUP-001');
    blur(idInput);

    stabilize(220);

    const idCtrl = component.form.get('id')!;
    expect(verifyId.execute).toHaveBeenCalledWith('DUP-001');
    expect(idCtrl.errors?.['duplicate']).toBe(true);
    expect(component.fieldError('id')).toBe('El identificador ya existe.');
  }));

  it('uniqueIdValidator: en edit NO debe llamar verifyId', fakeAsync(() => {
    const mockProduct: Product = {
      id: 'EDIT-2',
      name: 'Prod',
      description: 'Desc',
      logo: 'https://example.com/logo.png',
      dateRelease: new Date('2030-03-01T12:00:00.000Z'),
      dateRevision: new Date('2031-03-01T12:00:00.000Z'),
    };

    setup('EDIT-2', { getProduct$: of(mockProduct), verifyId$: of(true) });
    fixture.detectChanges();
    stabilize();

    // Aunque forcemos updateValueAndValidity, el validator retorna null si isEdit() === true.
    const idCtrl = component.form.get('id')!;
    idCtrl.enable({ emitEvent: false });
    idCtrl.setValue('EDIT-2');
    idCtrl.updateValueAndValidity();
    stabilize(300);

    expect(component.isEdit()).toBe(true);
    expect(verifyId.execute).not.toHaveBeenCalled();
  }));
});
