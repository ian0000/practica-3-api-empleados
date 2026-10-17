import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, catchError, defer, finalize, tap } from 'rxjs';
import { ApiResponse, Empleado, EmpleadoData } from '../models/empleado';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly url = environment.apiUrl + '/empleados';
  private readonly empleadosSubject = new BehaviorSubject<readonly Empleado[]>([]);
  private readonly cargandoSubject = new BehaviorSubject(false);
  private readonly errorSubject = new BehaviorSubject('');

  readonly empleados$ = this.empleadosSubject.asObservable();
  readonly cargando$ = this.cargandoSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  cargar(): Observable<ApiResponse<Empleado[]>> {
    return this.ejecutar(this.http.get<ApiResponse<Empleado[]>>(this.url), response => {
      this.empleadosSubject.next(response.data.map(empleado => ({ ...empleado })));
    });
  }

  consultar(id: string): Observable<ApiResponse<Empleado>> {
    return this.ejecutar(this.http.get<ApiResponse<Empleado>>(this.url + '/' + id));
  }

  crear(data: EmpleadoData): Observable<ApiResponse<Empleado>> {
    return this.ejecutar(this.http.post<ApiResponse<Empleado>>(this.url, data), response => {
      this.empleadosSubject.next([...this.empleadosSubject.value, response.data]);
    });
  }

  actualizar(id: string, data: EmpleadoData): Observable<ApiResponse<Empleado>> {
    return this.ejecutar(this.http.put<ApiResponse<Empleado>>(this.url + '/' + id, data), response => {
      this.empleadosSubject.next(this.empleadosSubject.value.map(
        empleado => empleado._id === id ? response.data : empleado
      ));
    });
  }

  eliminar(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.ejecutar(this.http.delete<ApiResponse<{ id: string }>>(this.url + '/' + id), () => {
      this.empleadosSubject.next(this.empleadosSubject.value.filter(empleado => empleado._id !== id));
    });
  }

  private ejecutar<T>(
    request: Observable<ApiResponse<T>>,
    aplicar: (response: ApiResponse<T>) => void = () => {}
  ): Observable<ApiResponse<T>> {
    // defer inicia el estado al suscribirse. La UI permite una operación a la vez.
    return defer(() => {
      if (this.cargandoSubject.value) return EMPTY;
      this.cargandoSubject.next(true);
      this.errorSubject.next('');
      return request.pipe(
        tap(aplicar),
        catchError((error: HttpErrorResponse) => {
          const body = error.error as Partial<ApiResponse<never>> | null;
          const detalles = Array.isArray(body?.errors)
            ? body.errors.map(issue => issue.field + ': ' + issue.message).join('; ') : '';
          this.errorSubject.next(error.status === 0
            ? 'No se pudo conectar con el backend en localhost:3000.'
            : [body?.message || 'No se pudo completar la operación', detalles].filter(Boolean).join('. '));
          return EMPTY;
        }),
        finalize(() => this.cargandoSubject.next(false))
      );
    });
  }
}
