import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { ProductList } from './product-list';
import { Product } from '../../../../domain/products/entities/product.entity';
import { ProductListVm } from './product-list-view/product-list-view';

import { GetProductsUseCase } from '../../../../domain/products/use-cases/get-products.usecase';
import { DeleteProductUseCase } from '../../../../domain/products/use-cases/delete-product.usecase';
import { ToastService } from '../../../../core/ui/toast/toast.service';

@Component({
  selector: 'app-product-list-view',
  template: '',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
class ProductListViewStubComponent {
  @Input({ required: true }) vm!: ProductListVm;

  @Input() confirmOpen = false;
  @Input() pendingDeleteName = '';
  @Input() deleting = false;

  @Output() create = new EventEmitter<void>();
  @Output() searchO = new EventEmitter<string>();

  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() prevPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();

  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  @Output() confirmDelete = new EventEmitter<void>();
  @Output() cancelConfirm = new EventEmitter<void>();
}

describe('ProductList (Jest)', () => {
  let fixture: ComponentFixture<ProductList>;
  let component: ProductList;

  let getProducts: { execute: jest.Mock };
  let deleteProduct: { execute: jest.Mock };
  let toast: { show: jest.Mock };
  let router: { navigate: jest.Mock };

  let warnSpy: jest.SpyInstance;

  const productsMock: Product[] = [
    {
      id: 'p1',
      name: 'Laptop',
      description: 'Gaming',
      logo: 'https://example.com/1.png',
      dateRelease: new Date('2025-01-01'),
      dateRevision: new Date('2026-01-01'),
    },
    {
      id: 'p2',
      name: 'Mouse',
      description: 'Wireless',
      logo: 'https://example.com/2.png',
      dateRelease: new Date('2025-02-01'),
      dateRevision: new Date('2026-02-01'),
    },
    {
      id: 'p3',
      name: 'Keyboard',
      description: 'Mechanical',
      logo: 'https://example.com/3.png',
      dateRelease: new Date('2025-03-01'),
      dateRevision: new Date('2026-03-01'),
    },
  ];

  const child = (): ProductListViewStubComponent =>
    fixture.debugElement.query(By.directive(ProductListViewStubComponent)).componentInstance;

  function setup(opts?: { get$?: any; delete$?: any }) {
    getProducts = {
      execute: jest.fn().mockReturnValue(opts?.get$ ?? of(productsMock)),
    };

    deleteProduct = {
      execute: jest.fn().mockReturnValue(opts?.delete$ ?? of(void 0)),
    };

    toast = { show: jest.fn() };
    router = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      declarations: [ProductList, ProductListViewStubComponent],
      providers: [
        { provide: GetProductsUseCase, useValue: getProducts },
        { provide: DeleteProductUseCase, useValue: deleteProduct },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('debe crear el componente y bindear vm/inputs al child', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    // ngOnInit corre en detectChanges()
    fixture.detectChanges();
    tick();

    const c = child();
    expect(c.vm.loading).toBe(false);
    expect(c.vm.total).toBe(productsMock.length);

    // Inputs de confirm
    expect(c.confirmOpen).toBe(false);
    expect(c.pendingDeleteName).toBe('');
    expect(c.deleting).toBe(false);
  }));

  it('ngOnInit(): debe cargar productos (success) y desactivar loading', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    expect(getProducts.execute).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
    expect(component.products()).toEqual(productsMock);
  }));

  it('load(): error => toast error y products = []', fakeAsync(() => {
    setup({ get$: throwError(() => new Error('fail')) });

    fixture.detectChanges();
    tick();

    expect(getProducts.execute).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
    expect(component.products()).toEqual([]);
    expect(toast.show).toHaveBeenCalledWith('error', 'No se pudieron cargar los productos');
  }));

  it('onCreate(): debe navegar a /products/new', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    child().create.emit();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/products/new']);
  }));

  it('onSearch(value): debe setear query y resetear page a 1 y reflejarse en vm', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    component.page.set(3);
    fixture.detectChanges();

    child().searchO.emit('  abc  ');
    tick();
    fixture.detectChanges();

    expect(component.query()).toBe('  abc  ');
    expect(component.page()).toBe(1);

    expect(child().vm.query).toBe('  abc  ');
  }));

  it('onPageSizeChange(n): debe aceptar solo 5/10/20; si no, no cambia pageSize; si es válido, resetea page a 1', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    // Al poner una page > 1 que sea válida respecto al totalPages actual.
    // Con 3 productos y pageSize 10 => totalPages = 1, así que page se clamp-ea a 1.
    // Por eso primero bajamos pageSize a 2 para tener totalPages = 2 y poder usar page=2.
    component.pageSize.set(2);
    component.page.set(2);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    // Estado base
    const prevPage = component.page(); // debería ser 2 (válida)
    const prevPageSize = component.pageSize(); // 2

    // Emit inválido: NO debe cambiar pageSize (y no debería cambiar page por el método).
    child().pageSizeChange.emit(7);
    tick();
    fixture.detectChanges();

    expect(component.pageSize()).toBe(prevPageSize);
    expect(component.page()).toBe(prevPage);

    // Emit válido: debe setear pageSize y resetear page a 1
    child().pageSizeChange.emit(5);
    tick();
    fixture.detectChanges();

    expect(component.pageSize()).toBe(5);
    expect(component.page()).toBe(1);

    // binding hacia child
    expect(child().vm.pageSize).toBe(5);
    expect(child().vm.currentPage).toBe(1);
  }));

  it('prevPage(): no baja de 1', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    component.page.set(1);
    fixture.detectChanges();

    child().prevPage.emit();
    tick();
    fixture.detectChanges();

    expect(component.page()).toBe(1);

    component.page.set(2);
    fixture.detectChanges();

    child().prevPage.emit();
    tick();
    fixture.detectChanges();

    expect(component.page()).toBe(1);
  }));

  it('nextPage(): no pasa de totalPages', fakeAsync(() => {
    // 3 items, pageSize 2 => totalPages = 2
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    component.pageSize.set(2);
    component.page.set(2);
    fixture.detectChanges();

    expect(component.vm().totalPages).toBe(2);

    child().nextPage.emit();
    tick();
    fixture.detectChanges();

    expect(component.page()).toBe(2); // se queda en last

    component.page.set(1);
    fixture.detectChanges();

    child().nextPage.emit();
    tick();
    fixture.detectChanges();

    expect(component.page()).toBe(2);
  }));

  it('onEdit(id): debe navegar a /products/:id/edit', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    child().edit.emit('p2');
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/products', 'p2', 'edit']);
  }));

  it('onDelete(id): debe abrir confirm, setear pendingDeleteId y pendingDeleteName (por nombre si existe)', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    child().delete.emit('p2');
    tick();
    fixture.detectChanges();

    expect(component.confirmOpen()).toBe(true);
    expect(component.pendingDeleteId()).toBe('p2');
    expect(component.pendingDeleteName()).toBe('Mouse');

    // binding hacia child
    expect(child().confirmOpen).toBe(true);
    expect(child().pendingDeleteName).toBe('Mouse');
  }));

  it('onDelete(id): si no encuentra producto, pendingDeleteName debe ser el id', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    child().delete.emit('missing');
    tick();
    fixture.detectChanges();

    expect(component.confirmOpen()).toBe(true);
    expect(component.pendingDeleteId()).toBe('missing');
    expect(component.pendingDeleteName()).toBe('missing');
  }));

  it('closeConfirm(): debe cerrar modal y resetear estado de delete', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    // abre confirm y simula estado
    component.confirmOpen.set(true);
    component.pendingDeleteId.set('p1');
    component.pendingDeleteName.set('Laptop');
    component.deleting.set(true);
    fixture.detectChanges();

    child().cancelConfirm.emit();
    tick();
    fixture.detectChanges();

    expect(component.confirmOpen()).toBe(false);
    expect(component.pendingDeleteId()).toBeNull();
    expect(component.pendingDeleteName()).toBe('');
    expect(component.deleting()).toBe(false);

    expect(child().confirmOpen).toBe(false);
    expect(child().pendingDeleteName).toBe('');
    expect(child().deleting).toBe(false);
  }));

  it('confirmDelete(): si no hay pendingDeleteId, no hace nada', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    component.pendingDeleteId.set(null);
    fixture.detectChanges();

    child().confirmDelete.emit();
    tick();

    expect(deleteProduct.execute).not.toHaveBeenCalled();
  }));

  it('confirmDelete(): success => llama usecase, muestra toast success, remueve producto y cierra confirm', fakeAsync(() => {
    const delete$ = of(void 0);
    setup({ get$: of(productsMock), delete$ });

    fixture.detectChanges();
    tick();

    // abrir confirm para p2
    child().delete.emit('p2');
    tick();
    fixture.detectChanges();

    expect(component.deleting()).toBe(false);

    child().confirmDelete.emit(); // llama confirmDelete()
    tick();
    fixture.detectChanges();

    expect(deleteProduct.execute).toHaveBeenCalledWith('p2');
    expect(toast.show).toHaveBeenCalledWith('success', 'Producto eliminado');

    // p2 removido
    expect(component.products().some((p) => p.id === 'p2')).toBe(false);

    // confirm cerrado + state reseteado
    expect(component.confirmOpen()).toBe(false);
    expect(component.pendingDeleteId()).toBeNull();
    expect(component.pendingDeleteName()).toBe('');
    expect(component.deleting()).toBe(false);
  }));

  it('confirmDelete(): error => mantiene confirm abierto, setea deleting=false y muestra toast error', fakeAsync(() => {
    setup({ get$: of(productsMock), delete$: throwError(() => new Error('nope')) });

    fixture.detectChanges();
    tick();

    child().delete.emit('p1');
    tick();
    fixture.detectChanges();

    expect(component.confirmOpen()).toBe(true);

    child().confirmDelete.emit();
    tick();
    fixture.detectChanges();

    expect(deleteProduct.execute).toHaveBeenCalledWith('p1');
    expect(component.deleting()).toBe(false);
    expect(component.confirmOpen()).toBe(true); // no cierra en error
    expect(toast.show).toHaveBeenCalledWith('error', 'No se pudo eliminar el producto');
  }));

  it('computed: filtering/paging => vm.total, vm.products, from/to deben ajustarse', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    // pageSize 2, total 3 => totalPages 2
    component.pageSize.set(2);
    component.page.set(1);
    fixture.detectChanges();

    const vm1 = component.vm();
    expect(vm1.total).toBe(3);
    expect(vm1.totalPages).toBe(2);
    expect(vm1.currentPage).toBe(1);
    expect(vm1.products.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(vm1.from).toBe(1);
    expect(vm1.to).toBe(2);

    // next page
    component.page.set(2);
    fixture.detectChanges();

    const vm2 = component.vm();
    expect(vm2.currentPage).toBe(2);
    expect(vm2.products.map((p) => p.id)).toEqual(['p3']);
    expect(vm2.from).toBe(3);
    expect(vm2.to).toBe(3);

    // filtro reduce
    component.onSearch('mouse'); // coincide p2
    fixture.detectChanges();

    const vm3 = component.vm();
    expect(vm3.total).toBe(1);
    expect(vm3.totalPages).toBe(1);
    expect(vm3.currentPage).toBe(1);
    expect(vm3.products.map((p) => p.id)).toEqual(['p2']);
    expect(vm3.from).toBe(1);
    expect(vm3.to).toBe(1);
  }));

  it('effect: si page > totalPages, debe clamp a totalPages', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    component.pageSize.set(2); // totalPages 2
    component.page.set(999);
    fixture.detectChanges();

    // el effect corre al recalcular señales
    tick();
    fixture.detectChanges();

    expect(component.page()).toBe(2);
  }));

  it('effect: si page < 1, debe clamp a 1', fakeAsync(() => {
    setup({ get$: of(productsMock) });

    fixture.detectChanges();
    tick();

    component.page.set(0);
    fixture.detectChanges();

    tick();
    fixture.detectChanges();

    expect(component.page()).toBe(1);
  }));

  it('load(): con Subject, debe mantener loading=true hasta completar/finalize', fakeAsync(() => {
    const subj = new Subject<Product[]>();
    setup({ get$: subj.asObservable() });

    fixture.detectChanges(); // ngOnInit -> load
    expect(component.loading()).toBe(true);

    subj.next(productsMock);
    subj.complete();
    tick();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.products()).toEqual(productsMock);
  }));
});
