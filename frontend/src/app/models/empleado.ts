export interface EmpleadoData {
  readonly nombre: string;
  readonly cargo: string;
  readonly departamento: string;
  readonly sueldo: number;
}

export interface Empleado extends EmpleadoData {
  readonly _id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: { field: string; message: string }[];
  meta: { page: number; limit: number; total: number; totalPages: number } | null;
}
