import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Empleado, EmpleadoData } from '../../models/empleado';

@Component({
  selector: 'app-empleado-form',
  templateUrl: './empleado-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmpleadoFormComponent implements OnChanges {
  @Input() empleado: Empleado | null = null;
  @Input() ocupado = false;
  @Input() reinicio = 0;
  @Output() readonly guardar = new EventEmitter<EmpleadoData>();
  @Output() readonly cancelar = new EventEmitter<void>();
  @ViewChild('form') form?: NgForm;

  // Copia local del borrador: editar el formulario nunca altera el @Input.
  borrador = this.vacio();

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['empleado'] && !changes['reinicio']) return;
    const data = this.empleado;
    this.borrador = data ? {
      nombre: data.nombre, cargo: data.cargo, departamento: data.departamento, sueldo: data.sueldo
    } : this.vacio();
    this.form?.resetForm(this.borrador);
  }

  enviar(form: NgForm): void {
    if (form.invalid || this.ocupado) return;
    const data = {
      ...this.borrador,
      nombre: this.borrador.nombre.trim(),
      cargo: this.borrador.cargo.trim(),
      departamento: this.borrador.departamento.trim()
    };
    if ([data.nombre, data.cargo, data.departamento].some(value => value.length < 2)) return;
    this.guardar.emit(data);
    // El orquestador limpia el formulario únicamente después del éxito HTTP.
  }

  limpiar(): void {
    if (this.ocupado) return;
    this.borrador = this.vacio();
    this.form?.resetForm(this.borrador);
    this.cancelar.emit();
  }

  private vacio() {
    return { nombre: '', cargo: '', departamento: '', sueldo: 0 };
  }
}
