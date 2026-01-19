import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent (Jest)', () => {
  let fixture: ComponentFixture<SkeletonComponent>;
  let component: SkeletonComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SkeletonComponent],
    });

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('por defecto rows=6 debe renderizar 6 bloques .sk', () => {
    fixture.detectChanges();

    const blocks = fixture.debugElement.queryAll(By.css('.sk'));
    expect(blocks.length).toBe(6);

    blocks.forEach((b) => {
      expect(b.queryAll(By.css('.sk__line')).length).toBe(3);
      expect(b.queryAll(By.css('.sk__line.w40')).length).toBe(1);
      expect(b.queryAll(By.css('.sk__line.w70')).length).toBe(1);
      expect(b.queryAll(By.css('.sk__line.w55')).length).toBe(1);
    });
  });

  it('si rows=1 debe renderizar 1 bloque .sk', () => {
    fixture.componentRef.setInput('rows', 1);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.sk')).length).toBe(1);
  });

  it('si rows=0 no debe renderizar bloques .sk', () => {
    fixture.componentRef.setInput('rows', 0);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.sk')).length).toBe(0);
  });

  it('debe reaccionar a cambios de rows (OnPush)', () => {
    fixture.componentRef.setInput('rows', 2);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.sk')).length).toBe(2);

    fixture.componentRef.setInput('rows', 4);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.sk')).length).toBe(4);
  });
});
