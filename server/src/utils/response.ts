import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400
) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};
