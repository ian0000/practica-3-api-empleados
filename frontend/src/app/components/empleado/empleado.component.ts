import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EmployeeService } from '../../services/empleado.service';
import { Empleado, EmpleadoData } from '../../models/empleado';

@Component({
  selector: 'app-empleado',
  templateUrl: './empleado.component.html',
  styleUrl: './empleado.component.css'
})
export class EmpleadoComponent implements OnInit {
  readonly empleados$ = this.employeeService.empleados$;
  readonly cargando$ = this.employeeService.cargando$;
  readonly error$ = this.employeeService.error$;
  seleccionado: Empleado | null = null;
  mensaje = '';
  reinicio = 0;

  constructor(
    private readonly employeeService: EmployeeService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.recargar();
  }

  recargar(): void {
    this.mensaje = '';
    this.employeeService.cargar().subscribe();
  }

  guardar(data: EmpleadoData): void {
    this.mensaje = '';
    const request = this.seleccionado
      ? this.employeeService.actualizar(this.seleccionado._id, data)
      : this.employeeService.crear(data);
    request.subscribe(response => {
      this.mensaje = response.message;
      this.seleccionado = null;
      this.reinicio++;
    });
  }

  editar(empleado: Empleado): void {
    this.mensaje = '';
    this.employeeService.consultar(empleado._id).subscribe(response => {
      this.seleccionado = { ...response.data };
    });
  }

  eliminar(empleado: Empleado): void {
    this.mensaje = '';
    this.employeeService.eliminar(empleado._id).subscribe(response => {
      if (this.seleccionado?._id === empleado._id) this.seleccionado = null;
      this.mensaje = response.message;
    });
  }

  limpiar(): void {
    this.seleccionado = null;
    this.mensaje = '';
  }
}
