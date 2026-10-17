import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Empleado } from '../../models/empleado';

@Component({
  selector: 'app-empleado-list',
  templateUrl: './empleado-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmpleadoListComponent {
  @Input() empleados: readonly Empleado[] = [];
  @Input() ocupado = false;
  @Output() readonly editar = new EventEmitter<Empleado>();
  @Output() readonly eliminar = new EventEmitter<Empleado>();

  identificar(_index: number, empleado: Empleado): string {
    return empleado._id;
  }
}
