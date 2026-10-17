import { Router } from 'express';
import { createEmpleadoController } from '../controllers/empleados.controllers.js';
import type { IEmployeeRepository } from '../repository/IEmployeeRepository.js';

export function createEmpleadosRoutes(repository: IEmployeeRepository) {
  const router = Router();
  const empleado = createEmpleadoController(repository);

  router.get('/empleados', empleado.getEmpleados);
  router.get('/empleados/:id', empleado.getEmpleadoById);
  router.post('/empleados', empleado.addEmpleado);
  router.put('/empleados/:id', empleado.updateEmpleado);
  router.patch('/empleados/:id', empleado.updateEmpleado);
  router.delete('/empleados/:id', empleado.deleteEmpleado);

  return router;
}
