import type { Response } from 'express';

export interface ResponseIssue {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: ResponseIssue[];
  meta: Record<string, number> | null;
}

export function sendSuccess<T>(
  res: Response, data: T, message: string, status = 200,
  meta: Record<string, number> | null = null
) {
  const body: ApiResponse<T> = { success: true, data, message, errors: [], meta };
  return res.status(status).json(body);
}
