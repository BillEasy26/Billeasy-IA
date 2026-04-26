// ===========================================
// Middleware: Error Handler
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

// Classe de erro customizada
export class AppError extends Error {
  public statusCode: number;
  public codigo: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, codigo: string) {
    super(message);
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros comuns pré-definidos
export const Errors = {
  badRequest: (message: string) => new AppError(message, 400, 'BAD_REQUEST'),
  unauthorized: (message = 'Não autorizado') => new AppError(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Acesso negado') => new AppError(message, 403, 'FORBIDDEN'),
  notFound: (message = 'Recurso não encontrado') => new AppError(message, 404, 'NOT_FOUND'),
  conflict: (message: string) => new AppError(message, 409, 'CONFLICT'),
  tooManyRequests: (message = 'Muitas requisições') => new AppError(message, 429, 'TOO_MANY_REQUESTS'),
  internal: (message = 'Erro interno do servidor') => new AppError(message, 500, 'INTERNAL_ERROR'),
};

/**
 * Middleware de tratamento de erros
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log do erro
  logger.error('Erro na aplicação', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Determina o status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const codigo = err instanceof AppError ? err.codigo : 'INTERNAL_ERROR';

  // Resposta de erro
  const response: {
    sucesso: boolean;
    erro: string;
    codigo: string;
    stack?: string;
  } = {
    sucesso: false,
    erro: err.message || 'Ocorreu um erro inesperado',
    codigo,
  };

  // Inclui stack trace apenas em desenvolvimento
  if (config.isDev && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Middleware para rotas não encontradas
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Rota não encontrada', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    sucesso: false,
    erro: `Rota ${req.method} ${req.path} não encontrada`,
    codigo: 'ROUTE_NOT_FOUND',
  });
}

/**
 * Wrapper para async handlers (evita try-catch em cada rota)
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
