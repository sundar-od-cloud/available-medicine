import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: any[];
  constructor(message: string, errors: any[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];

  if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if ((err as any).code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if ((err as any).code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource not found';
  } else if ((err as any).code === '22P02') {
    // PostgreSQL invalid input syntax (e.g., invalid UUID)
    statusCode = 400;
    message = 'Invalid input format';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
