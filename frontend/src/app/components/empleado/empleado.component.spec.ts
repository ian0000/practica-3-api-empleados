import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmpleadoComponent } from './empleado.component';
import { EmpleadoFormComponent } from '../empleado-form/empleado-form.component';
import { EmpleadoListComponent } from '../empleado-list/empleado-list.component';
import { ApiResponse, Empleado } from '../../models/empleado';

const url = 'http://localhost:3000/api/empleados';
const employee: Empleado = {
  _id: '000000000000000000000001', nombre: 'Ana Torres', cargo: 'Dev',
  departamento: 'Sistemas', sueldo: 1000, createdAt: '2026-10-15', updatedAt: '2026-10-15'
};
const ok = <T>(data: T): ApiResponse<T> => ({
  success: true, data, message: 'Operación correcta', errors: [], meta: null
});

describe('CRUD desde los eventos reales del formulario y la tabla', () => {
  let fixture: ComponentFixture<EmpleadoComponent>;
  let http: HttpTestingController;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmpleadoComponent, EmpleadoFormComponent, EmpleadoListComponent],
      imports: [CommonModule, FormsModule, HttpClientTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(EmpleadoComponent);
    http = TestBed.inject(HttpTestingController);
    root = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne(url).flush(ok([]));
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => http.verify());

  async function setInput(name: string, value: string) {
    const input = root.querySelector<HTMLInputElement>('[name="' + name + '"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function render() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('crea, edita sin mutar la fila, guarda, limpia sin enviar y elimina', async () => {
    await setInput('nombre', employee.nombre);
    await setInput('cargo', employee.cargo);
    await setInput('departamento', employee.departamento);
    await setInput('sueldo', '1000');
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    const post = http.expectOne(url);
    expect(post.request.method).toBe('POST');
    expect(post.request.body._id).toBeUndefined();
    post.flush(ok(employee));
    await render();
    expect(root.querySelector('tbody')!.textContent).toContain('Ana Torres');
    expect(root.querySelector<HTMLInputElement>('[name="nombre"]')!.value).toBe('');

    root.querySelector<HTMLButtonElement>('button[aria-label="Editar a Ana Torres"]')!.click();
    http.expectOne(url + '/' + employee._id).flush(ok(employee));
    await render();
    await setInput('nombre', 'Ana Editada');
    expect(root.querySelector('tbody')!.textContent).toContain('Ana Torres');
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    const put = http.expectOne(url + '/' + employee._id);
    expect(put.request.method).toBe('PUT');
    put.flush(ok({ ...employee, nombre: 'Ana Editada' }));
    await render();
    expect(root.querySelector('tbody')!.textContent).toContain('Ana Editada');

    await setInput('nombre', 'Borrador sin guardar');
    const clear = Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
      .find(button => button.textContent?.trim() === 'Limpiar')!;
    expect(clear.type).toBe('button');
    clear.click();
    await render();
    expect(root.querySelector<HTMLInputElement>('[name="nombre"]')!.value).toBe('');
    http.expectNone(url);
    root.querySelector<HTMLButtonElement>('button[aria-label="Eliminar a Ana Editada"]')!.click();
    const remove = http.expectOne(url + '/' + employee._id);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(ok({ id: employee._id }));
    await render();
    expect(root.querySelector('tbody')).toBeNull();
  });

  it('un error al guardar conserva el borrador y muestra el mensaje para reintentar', async () => {
    await setInput('nombre', 'Ana Torres');
    await setInput('cargo', 'Dev');
    await setInput('departamento', 'Sistemas');
    await setInput('sueldo', '1000');
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await render();
    http.expectOne(url).flush({ message: 'Error interno del servidor', errors: [] },
      { status: 500, statusText: 'Error' });
    await render();
    expect(root.querySelector<HTMLInputElement>('[name="nombre"]')!.value).toBe('Ana Torres');
    expect(root.querySelector('[role="alert"]')!.textContent).toContain('Error interno');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBeFalse();
  });
});
