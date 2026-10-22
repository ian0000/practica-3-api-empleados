import { Router } from 'express';
import { createEmpleadoController } from '../controllers/empleados.controllers.js';
import type { IEmployeeRepository } from '../repository/IEmployeeRepository.js';

export function createEmpleadosRoutes(repository: IEmployeeRepository) {
  const router = Router();
  const empleado = createEmpleadoController(repository);

  // Conserva el contrato del frontend y añade la ruta de la nueva consigna.
  for (const path of ['/empleados', '/v1/employees']) {
    router.get(path, empleado.getEmpleados);
    router.get(path + '/:id', empleado.getEmpleadoById);
    router.post(path, empleado.addEmpleado);
    router.put(path + '/:id', empleado.updateEmpleado);
    router.patch(path + '/:id', empleado.updateEmpleado);
    router.delete(path + '/:id', empleado.deleteEmpleado);
  }

  return router;
}
