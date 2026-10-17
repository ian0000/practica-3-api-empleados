import { z } from 'zod';
import type { EmployeeData } from '../domain/employee.js';

// Validación estructural de los campos de identidad definidos en la práctica.
const text = z.string().trim().min(2, 'Debe tener al menos 2 caracteres').max(100);

export const createEmployeeDto = z.object({
  nombre: text,
  cargo: text,
  departamento: text,
  sueldo: z.number().finite().min(0, 'El sueldo no puede ser negativo')
}).strict();

export const updateEmployeeDto = createEmployeeDto.partial().refine(
  data => Object.keys(data).length > 0,
  'Envía al menos un campo para actualizar'
).transform((data): Partial<EmployeeData> => {
  // No se propaga undefined como una mutación; conserva exactOptionalPropertyTypes.
  const update: Partial<EmployeeData> = {};
  if (data.nombre !== undefined) update.nombre = data.nombre;
  if (data.cargo !== undefined) update.cargo = data.cargo;
  if (data.departamento !== undefined) update.departamento = data.departamento;
  if (data.sueldo !== undefined) update.sueldo = data.sueldo;
  return update;
});

export const employeeParamsDto = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'El ID debe contener 24 caracteres hexadecimales')
});

export const employeeQueryDto = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
}).strict();
