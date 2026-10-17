import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AppComponent } from './app.component';

@Component({ selector: 'app-empleado', template: '<h1>Gestión de empleados</h1>' })
class EmpleadoStubComponent {}

describe('AppComponent', () => {
  it('monta el módulo de empleados', async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent, EmpleadoStubComponent]
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-empleado')).toBeTruthy();
  });
});
