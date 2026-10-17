import type { InferSchemaType, Types } from 'mongoose';
import Empleado from '../models/empleado.js';
import type { Employee, EmployeeData, EmployeeList, Pagination } from '../domain/employee.js';
import type { IEmployeeRepository } from './IEmployeeRepository.js';

type MongoEmployeeDocument = InferSchemaType<typeof Empleado.schema> & { _id: Types.ObjectId };

function toEmployee(document: MongoEmployeeDocument): Employee {
  return {
    _id: document._id.toString(),
    nombre: document.nombre,
    cargo: document.cargo,
    departamento: document.departamento,
    sueldo: document.sueldo,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export class MongoEmployeeRepository implements IEmployeeRepository {
  async findAll(pagination?: Pagination): Promise<EmployeeList> {
    const query = Empleado.find().sort({ _id: 1 });
    if (pagination) query.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
    const [employees, total] = await Promise.all([query.exec(), Empleado.countDocuments()]);
    return { items: employees.map(toEmployee), total };
  }

  async findById(id: string): Promise<Employee | null> {
    const document = await Empleado.findById(id);
    return document ? toEmployee(document) : null;
  }

  async create(employee: EmployeeData): Promise<Employee> {
    const document = await Empleado.create(employee);
    return toEmployee(document);
  }

  async update(id: string, employee: Partial<EmployeeData>): Promise<Employee | null> {
    const document = await Empleado.findByIdAndUpdate(id, { $set: employee }, {
      returnDocument: 'after', runValidators: true
    });
    return document ? toEmployee(document) : null;
  }

  async delete(id: string): Promise<boolean> {
    const document = await Empleado.findByIdAndDelete(id);
    return document !== null;
  }
}
