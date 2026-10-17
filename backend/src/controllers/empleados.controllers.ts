import type { Request, Response } from 'express';
import type { IEmployeeRepository } from '../repository/IEmployeeRepository.js';
import { createEmployeeDto, updateEmployeeDto, employeeParamsDto, employeeQueryDto } from '../dto/employee.dto.js';
import { AppError } from '../http/error-handler.js';
import { sendSuccess } from '../http/response.js';

export function createEmpleadoController(repository: IEmployeeRepository) {
  const getEmpleados = async (req: Request, res: Response) => {
    const query = employeeQueryDto.parse(req.query);
    const pagination = query.page !== undefined || query.limit !== undefined
      ? { page: query.page ?? 1, limit: query.limit ?? 10 } : undefined;
    const { items, total } = await repository.findAll(pagination);
    const limit = pagination?.limit ?? total;
    sendSuccess(res, items, 'Empleados consultados', 200, {
      page: pagination?.page ?? 1, limit, total,
      totalPages: limit === 0 ? 0 : Math.ceil(total / limit)
    });
  };

  const getEmpleadoById = async (req: Request, res: Response) => {
    const { id } = employeeParamsDto.parse(req.params);
    const empleado = await repository.findById(id);
    if (!empleado) throw new AppError(404, 'Empleado no encontrado');
    sendSuccess(res, empleado, 'Empleado consultado');
  };

  const addEmpleado = async (req: Request, res: Response) => {
    const data = createEmployeeDto.parse(req.body);
    const empleado = await repository.create(data);
    res.location(`/api/empleados/${empleado._id}`);
    sendSuccess(res, empleado, 'Empleado creado', 201);
  };

  const updateEmpleado = async (req: Request, res: Response) => {
    const { id } = employeeParamsDto.parse(req.params);
    // PUT exige todos los campos editables; PATCH permite un subconjunto no vacío.
    const data = (req.method === 'PUT' ? createEmployeeDto : updateEmployeeDto).parse(req.body);
    const empleado = await repository.update(id, data);
    if (!empleado) throw new AppError(404, 'Empleado no encontrado');
    sendSuccess(res, empleado, 'Empleado actualizado');
  };

  const deleteEmpleado = async (req: Request, res: Response) => {
    const { id } = employeeParamsDto.parse(req.params);
    if (!await repository.delete(id)) throw new AppError(404, 'Empleado no encontrado');
    sendSuccess(res, { id }, 'Empleado eliminado');
  };

  return { getEmpleados, getEmpleadoById, addEmpleado, updateEmpleado, deleteEmpleado };
}
