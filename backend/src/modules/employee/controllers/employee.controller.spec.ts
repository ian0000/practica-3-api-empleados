import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createEmpleadoController } from '../../../controllers/empleados.controllers.js';
import type { IEmployeeRepository } from '../../../repository/IEmployeeRepository.js';
import type { Employee } from '../../../domain/employee.js';

describe('EmployeeController: modularidad con repositorio inyectado', () => {
  let controller: ReturnType<typeof createEmpleadoController>;
  let repository: jest.Mocked<IEmployeeRepository>;
  let response: Response;
  let statusMock: jest.MockedFunction<Response['status']>;
  let jsonMock: jest.MockedFunction<Response['json']>;
  let locationMock: jest.MockedFunction<Response['location']>;

  const employee: Employee = {
    _id: '000000000000000000000001',
    nombre: 'Andrés Mendoza', cargo: 'Arquitecto', departamento: 'TI', sueldo: 4000,
    createdAt: '2026-10-17T00:00:00.000Z', updatedAt: '2026-10-17T00:00:00.000Z',
  };

  beforeEach(() => {
    repository = {
      findAll: jest.fn<IEmployeeRepository['findAll']>(),
      findById: jest.fn<IEmployeeRepository['findById']>(),
      create: jest.fn<IEmployeeRepository['create']>(),
      update: jest.fn<IEmployeeRepository['update']>(),
      delete: jest.fn<IEmployeeRepository['delete']>(),
    };
    controller = createEmpleadoController(repository);
    statusMock = jest.fn<Response['status']>();
    jsonMock = jest.fn<Response['json']>();
    locationMock = jest.fn<Response['location']>();
    response = { status: statusMock, json: jsonMock, location: locationMock } as unknown as Response;
    statusMock.mockReturnValue(response);
    jsonMock.mockReturnValue(response);
    locationMock.mockReturnValue(response);
  });

  it('devuelve 200 y los empleados de la abstracción, sin conectar una base', async () => {
    repository.findAll.mockResolvedValue({ items: [employee], total: 1 });
    await controller.getEmpleados({ query: {} } as Request, response);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith(undefined);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true, data: [employee], message: 'Empleados consultados', errors: [],
      meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
    });
  });

  it('envía la paginación validada al repositorio', async () => {
    repository.findAll.mockResolvedValue({ items: [employee], total: 15 });
    await controller.getEmpleados({ query: { page: '2', limit: '10' } } as unknown as Request, response);
    expect(repository.findAll).toHaveBeenCalledWith({ page: 2, limit: 10 });
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      meta: { page: 2, limit: 10, total: 15, totalPages: 2 },
    }));
  });

  it('crea un empleado válido y devuelve 201 con el wrapper existente', async () => {
    const data = { nombre: employee.nombre, cargo: employee.cargo, departamento: employee.departamento, sueldo: employee.sueldo };
    repository.create.mockResolvedValue(employee);
    await controller.addEmpleado({ body: { ...data, nombre: '  Andrés Mendoza  ' } } as Request, response);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(data);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(locationMock).toHaveBeenCalledWith('/api/empleados/' + employee._id);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: employee }));
  });

  it('Zod rechaza sueldo negativo antes de invocar la persistencia', async () => {
    const request = { body: { nombre: 'Al', cargo: 'Dev', departamento: 'TI', sueldo: -500 } } as Request;
    await expect(controller.addEmpleado(request, response)).rejects.toBeInstanceOf(ZodError);
    expect(repository.create).not.toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('rechaza un ID inválido sin consultar el repositorio', async () => {
    await expect(controller.getEmpleadoById({ params: { id: 'invalido' } } as unknown as Request, response)).rejects.toBeInstanceOf(ZodError);
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('un ID válido ausente produce el error de dominio 404', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(controller.getEmpleadoById({ params: { id: employee._id } } as unknown as Request, response))
      .rejects.toMatchObject({ status: 404, message: 'Empleado no encontrado' });
    expect(repository.findById).toHaveBeenCalledWith(employee._id);
  });

  it('propaga un fallo del repositorio hacia el interceptor HTTP', async () => {
    const failure = new Error('Fallo simulado');
    repository.findAll.mockRejectedValue(failure);
    await expect(controller.getEmpleados({ query: {} } as Request, response)).rejects.toBe(failure);
    expect(statusMock).not.toHaveBeenCalled();
  });
});
