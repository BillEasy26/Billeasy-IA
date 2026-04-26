// ===========================================
// Middleware: Autenticação Service-to-Service
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Extende o tipo Request para incluir serviceInfo
declare global {
  namespace Express {
    interface Request {
      serviceInfo?: {
        authenticated: boolean;
        serviceId?: string;
      };
    }
  }
}

/**
 * Middleware de autenticação via Service Token
 * Usado para comunicação entre serviços (Java Backend <-> Node AI Service)
 */
export function serviceAuth(req: Request, res: Response, next: NextFunction): void {
  const serviceToken = req.headers['x-service-token'] as string;

  if (!serviceToken) {
    logger.warn('Requisição sem service token', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(401).json({
      sucesso: false,
      erro: 'Token de serviço não fornecido',
      codigo: 'AUTH_TOKEN_MISSING',
    });
    return;
  }

  // Valida o token
  if (serviceToken !== config.billeasyApi.serviceToken) {
    logger.warn('Token de serviço inválido', {
      ip: req.ip,
      path: req.path,
    });

    res.status(403).json({
      sucesso: false,
      erro: 'Token de serviço inválido',
      codigo: 'AUTH_TOKEN_INVALID',
    });
    return;
  }

  // Token válido
  req.serviceInfo = {
    authenticated: true,
    serviceId: 'billeasy-backend',
  };

  logger.debug('Autenticação de serviço bem sucedida', { path: req.path });

  next();
}

/**
 * Middleware opcional de autenticação
 * Não bloqueia se não houver token, mas popula serviceInfo se houver
 */
export function optionalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const serviceToken = req.headers['x-service-token'] as string;

  if (serviceToken && serviceToken === config.billeasyApi.serviceToken) {
    req.serviceInfo = {
      authenticated: true,
      serviceId: 'billeasy-backend',
    };
  } else {
    req.serviceInfo = {
      authenticated: false,
    };
  }

  next();
}

/**
 * Middleware de validação de API Key (para integrações externas futuras)
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      sucesso: false,
      erro: 'API Key não fornecida',
      codigo: 'API_KEY_MISSING',
    });
    return;
  }

  // TODO: Validar API Key contra banco de dados ou lista de keys válidas
  // Por agora, apenas verifica se foi fornecida
  logger.debug('API Key recebida', { keyPrefix: apiKey.substring(0, 8) });

  next();
}
