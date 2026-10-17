import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse, ResponseIssue } from './response.js';

export class AppError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let status = 500;
  let message = 'Error interno del servidor';
  let errors: ResponseIssue[] = [];

  if (error instanceof ZodError) {
    status = 400;
    message = 'Datos de entrada inválidos';
    errors = error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (error instanceof AppError) {
    status = error.status;
    message = error.message;
  } else if (error && typeof error === 'object' && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      status = 400;
      message = 'El cuerpo debe ser JSON válido';
    } else if (error.type === 'entity.too.large') {
      status = 413;
      message = 'El cuerpo de la solicitud es demasiado grande';
    }
  }

  if (status === 500) console.error('Error no controlado:', error);
  const body: ApiResponse<never> = { success: false, data: null, message, errors, meta: null };
  res.status(status).json(body);
};
