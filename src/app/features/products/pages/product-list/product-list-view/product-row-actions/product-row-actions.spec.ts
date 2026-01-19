import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ProductRowActions } from './product-row-actions';

describe('ProductRowActions (Jest)', () => {
  let fixture: ComponentFixture<ProductRowActions>;
  let component: ProductRowActions;

  function detect() {
    fixture.detectChanges();
  }

  function q(css: string): HTMLElement {
    const el = fixture.nativeElement.querySelector(css) as HTMLElement | null;
    if (!el) throw new Error(`No se encontró selector: ${css}`);
    return el;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProductRowActions],
    });

    fixture = TestBed.createComponent(ProductRowActions);
    component = fixture.componentInstance;

    component.productId = 'P-1';
    detect();
  });

  it('debe iniciar con open=false y no renderizar el menú', () => {
    expect(component.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.menu')).toBeFalsy();
    expect(q('button.icon-btn')).toBeTruthy();
    expect(q('button.icon-btn').getAttribute('aria-expanded')).toBe('false');
  });

  it('toggle(): debe alternar open y actualizar aria-expanded', () => {
    const btn = q('button.icon-btn');

    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(component.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('.menu')).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('true');

    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(component.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.menu')).toBeFalsy();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('click en document debe cerrar el menú (HostListener document:click)', () => {
    // abrir
    q('button.icon-btn').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();
    expect(component.open()).toBe(true);

    // click afuera
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(component.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.menu')).toBeFalsy();
  });

  it('keydown escape en document debe cerrar el menú (HostListener document:keydown.escape)', () => {
    q('button.icon-btn').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();
    expect(component.open()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    detect();

    expect(component.open()).toBe(false);
  });

  it('click dentro del contenedor .actions NO debe cerrar por propagación (stopPropagation)', () => {
    q('button.icon-btn').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();
    expect(component.open()).toBe(true);

    // Click en wrapper .actions: tiene (click)="stop($event)"
    q('.actions').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    // Si stopPropagation funcionó, no llega al document:click
    expect(component.open()).toBe(true);
  });

  it('click dentro del menú NO debe cerrar por propagación (stopPropagation)', () => {
    q('button.icon-btn').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();
    expect(component.open()).toBe(true);

    q('.menu').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(component.open()).toBe(true);
  });

  it('onEdit(): debe cerrar, emitir edit(productId) y no dejar el menú abierto', () => {
    const editSpy = jest.spyOn(component.edit, 'emit');

    q('button.icon-btn').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();
    expect(component.open()).toBe(true);

    q('.menu .menu__item').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(editSpy).toHaveBeenCalledWith('P-1');
    expect(component.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.menu')).toBeFalsy();
  });

  it('onRemove(): debe cerrar, emitir remove(productId) y no dejar el menú abierto', () => {
    const removeSpy = jest.spyOn(component.remove, 'emit');

    q('button.icon-btn').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();
    expect(component.open()).toBe(true);

    q('.menu .menu__item.danger').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('P-1');
    expect(component.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.menu')).toBeFalsy();
  });

  it('debe usar aria-haspopup="menu" y aria-label "Abrir menú"', () => {
    const btn = q('button.icon-btn');
    expect(btn.getAttribute('aria-haspopup')).toBe('menu');
    expect(btn.getAttribute('aria-label')).toBe('Abrir menú');
  });

  it('close(): debe forzar open=false', () => {
    component.open.set(true);
    detect();
    expect(component.open()).toBe(true);

    component.close();
    detect();
    expect(component.open()).toBe(false);
  });

  it('stop(ev): debe llamar stopPropagation', () => {
    const ev = { stopPropagation: jest.fn() } as unknown as Event;
    component.stop(ev);
    expect((ev as any).stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('toggle(ev): debe llamar stopPropagation y alternar open', () => {
    const ev = { stopPropagation: jest.fn() } as unknown as Event;

    expect(component.open()).toBe(false);
    component.toggle(ev);
    expect((ev as any).stopPropagation).toHaveBeenCalledTimes(1);
    expect(component.open()).toBe(true);

    component.toggle(ev);
    expect(component.open()).toBe(false);
  });

  it('onEdit(ev) / onRemove(ev): deben llamar stopPropagation, cerrar y emitir', () => {
    const ev = { stopPropagation: jest.fn() } as unknown as Event;
    const editSpy = jest.spyOn(component.edit, 'emit');
    const removeSpy = jest.spyOn(component.remove, 'emit');

    component.open.set(true);
    detect();

    component.onEdit(ev);
    expect((ev as any).stopPropagation).toHaveBeenCalled();
    expect(editSpy).toHaveBeenCalledWith('P-1');
    expect(component.open()).toBe(false);

    component.open.set(true);
    detect();

    component.onRemove(ev);
    expect((ev as any).stopPropagation).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('P-1');
    expect(component.open()).toBe(false);
  });

  it('roles: cuando open=true, el contenedor menú debe tener role="menu" y items role="menuitem"', () => {
    q('button.icon-btn').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    const menuDe = fixture.debugElement.query(By.css('.menu'));
    expect(menuDe).toBeTruthy();
    expect(menuDe.attributes['role']).toBe('menu');

    const items = fixture.debugElement.queryAll(By.css('.menu [role="menuitem"]'));
    expect(items.length).toBe(2);
  });
});
