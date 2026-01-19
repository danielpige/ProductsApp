import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent (Jest)', () => {
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let component: ConfirmModalComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmModalComponent],
    });

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
  });

  function detect() {
    fixture.detectChanges();
  }

  function q(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  function click(selector: string) {
    const el = q(selector) as HTMLElement;
    if (!el) throw new Error(`No se encontró: ${selector}`);
    el.click();
    detect();
  }

  describe('render', () => {
    it('no debe renderizar nada cuando open=false', () => {
      component.open = false;
      detect();

      expect(q('.modal')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('Confirmar');
    });

    it('debe renderizar modal cuando open=true y mostrar título/mensaje/textos', () => {
      component.open = true;
      component.title = 'Eliminar producto';
      component.message = 'Esto no se puede deshacer';
      component.confirmText = 'Eliminar';
      component.cancelText = 'Volver';
      detect();

      expect(q('.modal')).toBeTruthy();
      expect(q('.modal__dialog')).toBeTruthy();

      expect(q('.modal__title')?.textContent).toContain('Eliminar producto');
      expect(q('.modal__body')?.textContent).toContain('Esto no se puede deshacer');

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(3);

      expect(buttons[1].nativeElement.textContent).toContain('Volver');
      expect(buttons[2].nativeElement.textContent).toContain('Eliminar');

      const dialog = q('.modal__dialog') as HTMLElement;
      expect(dialog.getAttribute('aria-label')).toBe('Eliminar producto');
    });

    it('debe aplicar clase danger al botón de confirmar cuando danger=true', () => {
      component.open = true;
      component.danger = true;
      detect();

      const confirmBtn = fixture.debugElement.queryAll(By.css('footer .btn'))[1]
        .nativeElement as HTMLElement;
      expect(confirmBtn.classList.contains('danger')).toBe(true);
    });

    it('cuando busy=true, el botón confirmar debe mostrar "Eliminando..."', () => {
      component.open = true;
      component.busy = true;
      component.confirmText = 'Eliminar';
      detect();

      const confirmBtn = fixture.debugElement.queryAll(By.css('footer .btn'))[1]
        .nativeElement as HTMLButtonElement;
      expect(confirmBtn.textContent).toContain('Eliminando...');
      expect(confirmBtn.textContent).not.toContain('Eliminar');
    });
  });

  describe('outputs y comportamiento', () => {
    it('click en confirmar debe emitir confirm UNA sola vez y bloquear confirmaciones posteriores', () => {
      component.open = true;
      component.busy = false;
      detect();

      const confirmSpy = jest.fn();
      component.confirm.subscribe(confirmSpy);

      click('footer .btn.danger, footer .btn:not(.danger):last-child');
      const confirmBtn = fixture.debugElement.queryAll(By.css('footer .btn'))[1]
        .nativeElement as HTMLButtonElement;
      confirmBtn.click();
      detect();

      expect(confirmSpy).toHaveBeenCalledTimes(1);

      confirmBtn.click();
      detect();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it('si busy=true, click confirmar NO debe emitir', () => {
      component.open = true;
      component.busy = true;
      detect();

      const confirmSpy = jest.fn();
      component.confirm.subscribe(confirmSpy);

      const confirmBtn = fixture.debugElement.queryAll(By.css('footer .btn'))[1]
        .nativeElement as HTMLButtonElement;
      confirmBtn.click();
      detect();

      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('click cancelar debe emitir cancelO y resetear estado de confirming (permite confirmar luego)', () => {
      component.open = true;
      component.busy = false;
      detect();

      const confirmSpy = jest.fn();
      const cancelSpy = jest.fn();
      component.confirm.subscribe(confirmSpy);
      component.cancelO.subscribe(cancelSpy);

      const footerBtns = fixture.debugElement.queryAll(By.css('footer .btn'));
      const cancelBtn = footerBtns[0].nativeElement as HTMLButtonElement;
      const confirmBtn = footerBtns[1].nativeElement as HTMLButtonElement;

      confirmBtn.click();
      detect();
      expect(confirmSpy).toHaveBeenCalledTimes(1);

      cancelBtn.click();
      detect();
      expect(cancelSpy).toHaveBeenCalledTimes(1);

      confirmBtn.click();
      detect();
      expect(confirmSpy).toHaveBeenCalledTimes(2);
    });

    it('si busy=true, cancelar NO debe emitir (ni close)', () => {
      component.open = true;
      component.busy = true;
      detect();

      const cancelSpy = jest.fn();
      component.cancelO.subscribe(cancelSpy);

      const footerBtns = fixture.debugElement.queryAll(By.css('footer .btn'));
      const cancelBtn = footerBtns[0].nativeElement as HTMLButtonElement;
      cancelBtn.click();
      detect();

      expect(cancelSpy).not.toHaveBeenCalled();

      const closeBtn = fixture.debugElement.query(By.css('.modal__close'))
        .nativeElement as HTMLButtonElement;
      expect(closeBtn.disabled).toBe(true);
    });

    it('click en backdrop (contenedor .modal) debe emitir cancelO', () => {
      component.open = true;
      component.busy = false;
      detect();

      const cancelSpy = jest.fn();
      component.cancelO.subscribe(cancelSpy);

      const backdrop = q('.modal') as HTMLElement;
      backdrop.click();
      detect();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('click dentro del diálogo NO debe disparar cancelO por stopPropagation()', () => {
      component.open = true;
      component.busy = false;
      detect();

      const cancelSpy = jest.fn();
      component.cancelO.subscribe(cancelSpy);

      const dialog = q('.modal__dialog') as HTMLElement;
      dialog.click();
      detect();

      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('ESC: si open=true debe cancelar (emit cancelO)', () => {
      component.open = true;
      component.busy = false;
      detect();

      const cancelSpy = jest.fn();
      component.cancelO.subscribe(cancelSpy);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      detect();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('ESC: si open=false NO debe emitir cancelO', () => {
      component.open = false;
      component.busy = false;
      detect();

      const cancelSpy = jest.fn();
      component.cancelO.subscribe(cancelSpy);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      detect();

      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('disabled states', () => {
    it('cuando busy=true debe deshabilitar close, cancel y confirm', () => {
      component.open = true;
      component.busy = true;
      detect();

      const closeBtn = fixture.debugElement.query(By.css('.modal__close'))
        .nativeElement as HTMLButtonElement;
      const footerBtns = fixture.debugElement.queryAll(By.css('footer .btn'));
      const cancelBtn = footerBtns[0].nativeElement as HTMLButtonElement;
      const confirmBtn = footerBtns[1].nativeElement as HTMLButtonElement;

      expect(closeBtn.disabled).toBe(true);
      expect(cancelBtn.disabled).toBe(true);
      expect(confirmBtn.disabled).toBe(true);
    });
  });
});
