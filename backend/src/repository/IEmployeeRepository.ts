import type { Employee, EmployeeData, EmployeeList, Pagination } from '../domain/employee.js';

export interface IEmployeeRepository {
  findAll(pagination?: Pagination): Promise<EmployeeList>;
  findById(id: string): Promise<Employee | null>;
  create(employee: EmployeeData): Promise<Employee>;
  update(id: string, employee: Partial<EmployeeData>): Promise<Employee | null>;
  delete(id: string): Promise<boolean>;
}
