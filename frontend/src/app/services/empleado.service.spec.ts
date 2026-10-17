import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from './empleado.service';
import { ApiResponse, Empleado } from '../models/empleado';

const url = 'http://localhost:3000/api/empleados';
const employee: Empleado = {
  _id: '000000000000000000000001', nombre: 'Ana Torres', cargo: 'Dev',
  departamento: 'Sistemas', sueldo: 1000, createdAt: '2026-10-15', updatedAt: '2026-10-15'
};
function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, message: 'Correcto', errors: [], meta: null };
}

describe('EmployeeService', () => {
  let service: EmployeeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(EmployeeService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('emite referencias nuevas al cargar, crear, actualizar y eliminar, conservando las anteriores', () => {
    const snapshots: (readonly Empleado[])[] = [];
    const subscription = service.empleados$.subscribe(value => snapshots.push(value));
    service.cargar().subscribe();
    http.expectOne(url).flush(ok([]));
    const { _id, createdAt, updatedAt, ...data } = employee;
    service.crear(data).subscribe();
    const post = http.expectOne(url);
    expect(post.request.method).toBe('POST');
    post.flush(ok(employee));
    service.actualizar(_id, { ...data, sueldo: 1500 }).subscribe();
    const put = http.expectOne(url + '/' + _id);
    expect(put.request.method).toBe('PUT');
    put.flush(ok({ ...employee, sueldo: 1500 }));
    service.eliminar(_id).subscribe();
    http.expectOne(url + '/' + _id).flush(ok({ id: _id }));

    expect(snapshots.map(value => value.length)).toEqual([0, 0, 1, 1, 0]);
    expect(snapshots[2][0].sueldo).toBe(1000);
    expect(snapshots[3][0].sueldo).toBe(1500);
    for (let index = 1; index < snapshots.length; index++) {
      expect(snapshots[index]).not.toBe(snapshots[index - 1]);
    }
    subscription.unsubscribe();
  });

  it('un fallo conserva la lista, expone el error y libera el estado de carga para reintentar', () => {
    let current: readonly Empleado[] = [];
    const busy: boolean[] = [];
    let error = '';
    service.empleados$.subscribe(value => current = value);
    service.cargando$.subscribe(value => busy.push(value));
    service.error$.subscribe(value => error = value);
    service.cargar().subscribe();
    http.expectOne(url).flush(ok([employee]));
    const before = current;
    service.eliminar(employee._id).subscribe();
    http.expectOne(url + '/' + employee._id).flush({
      success: false, data: null, message: 'Error interno del servidor', errors: [], meta: null
    }, { status: 500, statusText: 'Error' });
    expect(current).toBe(before);
    expect(error).toBe('Error interno del servidor');
    expect(busy[busy.length - 1]).toBeFalse();
    service.cargar().subscribe();
    http.expectOne(url).flush(ok([employee]));
    expect(error).toBe('');
  });
});
