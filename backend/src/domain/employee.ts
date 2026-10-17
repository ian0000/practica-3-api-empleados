export interface EmployeeData {
  nombre: string;
  cargo: string;
  departamento: string;
  sueldo: number;
}

// Contrato de datos independiente de documentos y tipos de Mongoose.
export interface Employee extends EmployeeData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface EmployeeList {
  items: Employee[];
  total: number;
}
