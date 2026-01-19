import { Component, EventEmitter, Input, Output, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { ProductListView, ProductListVm } from './product-list-view';

// ---- Stubs ----
@Component({
  selector: 'app-skeleton',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  template: '<div data-testid="skeleton">skeleton rows={{ rows }}</div>',
})
class SkeletonStubComponent {
  @Input() rows = 0;
}

@Component({
  selector: 'app-product-row-actions',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  template: `
    <div data-testid="row-actions">
      <button data-testid="edit" type="button" (click)="edit.emit(productId)">edit</button>
      <button data-testid="remove" type="button" (click)="remove.emit(productId)">remove</button>
    </div>
  `,
})
class ProductRowActionsStubComponent {
  @Input({ required: true }) productId!: string;
  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
}

@Component({
  selector: 'app-confirm-modal',
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
  template: `
    <div
      data-testid="confirm-modal"
      [attr.data-open]="open"
      [attr.data-busy]="busy"
      [attr.data-danger]="danger"
    >
      <div data-testid="title">{{ title }}</div>
      <div data-testid="message">{{ message }}</div>

      <button data-testid="confirm" type="button" (click)="confirm.emit()">confirm</button>
      <button data-testid="cancel" type="button" (click)="cancelO.emit()">cancel</button>
    </div>
  `,
})
class ConfirmModalStubComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = '';
  @Input() cancelText = '';
  @Input() danger = false;
  @Input() busy = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancelO = new EventEmitter<void>();
}

describe('ProductListView (Jest)', () => {
  let fixture: ComponentFixture<ProductListView>;
  let component: ProductListView;

  const baseVm: ProductListVm = {
    loading: false,
    query: '',
    total: 2,
    products: [
      {
        id: 'P-1',
        name: 'Prod 1',
        description: 'Desc 1',
        logo: 'https://a',
        dateRelease: new Date('2026-01-01T00:00:00.000Z'),
        dateRevision: new Date('2027-01-01T00:00:00.000Z'),
      },
      {
        id: 'P-2',
        name: 'Prod 2',
        description: 'Desc 2',
        logo: 'https://b',
        dateRelease: new Date('2026-02-01T00:00:00.000Z'),
        dateRevision: new Date('2027-02-01T00:00:00.000Z'),
      },
    ],
    pageSize: 10,
    currentPage: 1,
    totalPages: 3,
    from: 1,
    to: 2,
  };

  function setup(vm: ProductListVm = baseVm, extras?: Partial<ProductListView>) {
    TestBed.configureTestingModule({
      imports: [CommonModule], // <-- aquí viene DatePipe
      declarations: [
        ProductListView,
        SkeletonStubComponent,
        ProductRowActionsStubComponent,
        ConfirmModalStubComponent,
      ],
      providers: [
        // opcional: hace el DatePipe estable en formato/locale
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    });

    fixture = TestBed.createComponent(ProductListView);
    component = fixture.componentInstance;

    component.vm = vm;
    if (extras) Object.assign(component, extras);

    fixture.detectChanges();
  }

  function q(css: string): HTMLElement {
    const el = fixture.nativeElement.querySelector(css) as HTMLElement | null;
    if (!el) throw new Error(`No se encontró selector: ${css}`);
    return el;
  }

  it('debe renderizar el título y el botón "Nuevo producto"', () => {
    setup();

    expect(fixture.nativeElement.textContent).toContain('Productos');
    expect(fixture.nativeElement.textContent).toContain('Gestiona el catálogo');

    const btn = q('button.btn.primary');
    expect(btn.textContent?.trim()).toBe('Nuevo producto');
  });

  it('click en "Nuevo producto" debe emitir create', () => {
    setup();
    const spy = jest.spyOn(component.create, 'emit');

    q('button.btn.primary').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('debe setear el input search con vm.query y emitir searchO al escribir', () => {
    setup({ ...baseVm, query: 'abc' });
    const spy = jest.spyOn(component.searchO, 'emit');

    const input = q('input[type="search"]') as HTMLInputElement;
    expect(input.value).toBe('abc');

    input.value = 'nuevo';
    input.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('nuevo');
  });

  it('si vm.loading=true debe mostrar skeleton y NO la tabla/subbar', () => {
    setup({ ...baseVm, loading: true });

    expect(fixture.nativeElement.querySelector('[data-testid="skeleton"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.table')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.subbar')).toBeFalsy();
  });

  it('si vm.loading=false debe renderizar subbar con rangos y total', () => {
    setup({ ...baseVm, loading: false, from: 1, to: 2, total: 99 });

    const subbar = q('.subbar');
    expect(subbar.textContent).toContain('Mostrando');
    expect(subbar.textContent).toContain('1');
    expect(subbar.textContent).toContain('2');
    expect(subbar.textContent).toContain('99');
  });

  it('select pageSize debe reflejar vm.pageSize y emitir pageSizeChange al cambiar', () => {
    setup({ ...baseVm, pageSize: 10 });
    const spy = jest.spyOn(component.pageSizeChange, 'emit');

    const select = q('select.select') as HTMLSelectElement;
    expect(select.value).toBe('10');

    select.value = '20';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(20);
  });

  it('paginación: prevPage debe estar deshabilitado en página 1 y next habilitado si no es última', () => {
    setup({ ...baseVm, currentPage: 1, totalPages: 3 });

    const buttons = fixture.debugElement.queryAll(By.css('.pager button.btn'));
    const prev = buttons[0].nativeElement as HTMLButtonElement;
    const next = buttons[1].nativeElement as HTMLButtonElement;

    expect(prev.textContent?.trim()).toBe('Anterior');
    expect(prev.disabled).toBe(true);

    expect(next.textContent?.trim()).toBe('Siguiente');
    expect(next.disabled).toBe(false);
  });

  it('paginación: nextPage debe estar deshabilitado en última página y prev habilitado', () => {
    setup({ ...baseVm, currentPage: 3, totalPages: 3 });

    const buttons = fixture.debugElement.queryAll(By.css('.pager button.btn'));
    const prev = buttons[0].nativeElement as HTMLButtonElement;
    const next = buttons[1].nativeElement as HTMLButtonElement;

    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });

  it('click en botones pager debe emitir prevPage/nextPage', () => {
    setup({ ...baseVm, currentPage: 2, totalPages: 3 });

    const prevSpy = jest.spyOn(component.prevPage, 'emit');
    const nextSpy = jest.spyOn(component.nextPage, 'emit');

    const buttons = fixture.debugElement.queryAll(By.css('.pager button.btn'));
    (buttons[0].nativeElement as HTMLButtonElement).click();
    (buttons[1].nativeElement as HTMLButtonElement).click();

    expect(prevSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('debe renderizar filas por cada producto y pasar productId a app-product-row-actions', () => {
    setup({ ...baseVm, products: baseVm.products, total: 2 });

    // filas: 1 header + N productos
    const rows = fixture.debugElement.queryAll(By.css('.table .table__row'));
    expect(rows.length).toBe(1 + baseVm.products.length);

    const rowActions = fixture.debugElement.queryAll(By.directive(ProductRowActionsStubComponent));
    expect(rowActions.length).toBe(baseVm.products.length);

    expect((rowActions[0].componentInstance as ProductRowActionsStubComponent).productId).toBe(
      'P-1',
    );
    expect((rowActions[1].componentInstance as ProductRowActionsStubComponent).productId).toBe(
      'P-2',
    );
  });

  it('cuando ProductRowActions emite edit/remove, debe re-emitir edit/delete con el mismo id', () => {
    setup();

    const editSpy = jest.spyOn(component.edit, 'emit');
    const delSpy = jest.spyOn(component.delete, 'emit');

    const rowActionsDes = fixture.debugElement.queryAll(
      By.directive(ProductRowActionsStubComponent),
    );
    const first = rowActionsDes[0].componentInstance as ProductRowActionsStubComponent;

    first.edit.emit('P-1');
    first.remove.emit('P-1');

    expect(editSpy).toHaveBeenCalledWith('P-1');
    expect(delSpy).toHaveBeenCalledWith('P-1');
  });

  it('si vm.total === 0 debe mostrar el estado vacío', () => {
    setup({ ...baseVm, total: 0, products: [] });

    expect(fixture.nativeElement.querySelector('.empty')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('No hay productos para mostrar.');
  });

  it('ConfirmModal: debe pasar open/busy/danger y componer el message con pendingDeleteName', () => {
    setup({ ...baseVm }, { confirmOpen: true, deleting: true, pendingDeleteName: 'Prod X' });

    const modalDe = fixture.debugElement.query(By.directive(ConfirmModalStubComponent));
    const modal = modalDe.componentInstance as ConfirmModalStubComponent;

    expect(modal.open).toBe(true);
    expect(modal.busy).toBe(true);
    expect(modal.danger).toBe(true);

    expect(modal.title).toBe('Eliminar producto');
    expect(modal.message).toContain('Prod X');
  });

  it('ConfirmModal: cuando emite confirm/cancelO debe re-emitir confirmDelete/cancelConfirm', () => {
    setup();

    const confirmSpy = jest.spyOn(component.confirmDelete, 'emit');
    const cancelSpy = jest.spyOn(component.cancelConfirm, 'emit');

    const modalDe = fixture.debugElement.query(By.directive(ConfirmModalStubComponent));
    const modal = modalDe.componentInstance as ConfirmModalStubComponent;

    modal.confirm.emit();
    modal.cancelO.emit();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('toggleMenu(id): debe alternar openMenuForId entre id y null', () => {
    setup();

    expect(component.openMenuForId()).toBeNull();
    component.toggleMenu('P-1');
    expect(component.openMenuForId()).toBe('P-1');
    component.toggleMenu('P-1');
    expect(component.openMenuForId()).toBeNull();
  });

  it('onPageSizeSelect(value): debe convertir a number y emitir pageSizeChange', () => {
    setup();
    const spy = jest.spyOn(component.pageSizeChange, 'emit');

    component.onPageSizeSelect('5');
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('onSearchInput(value): debe emitir searchO', () => {
    setup();
    const spy = jest.spyOn(component.searchO, 'emit');

    component.onSearchInput('hola');
    expect(spy).toHaveBeenCalledWith('hola');
  });
});
