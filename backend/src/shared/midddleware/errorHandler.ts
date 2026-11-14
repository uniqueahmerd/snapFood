import { Request, Response, NextFunction } from 'express';
import { AppError }                         from '../utils/AppError';
import { logger }                           from '../../config/logger';

export const errorHandler = (
  err:  Error,
  req:  Request,
  res:  Response,
  next: NextFunction,
): void => {

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status:  err.statusCode >= 500 ? 'error' : 'fail',
      message: err.message,
    });
    return;
  }

  logger.error('Unexpected error', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
  });

  res.status(500).json({
    status:  'error',
    message: 'Something went wrong. Please try again later.',
  });
};