// ===========================================
// Middleware: Rate Limiting
// ===========================================

import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Rate limiter padrão para API
 */
export const defaultRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    erro: 'Muitas requisições. Tente novamente em alguns minutos.',
    codigo: 'RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // Usa o service token como chave se disponível, senão usa IP
    const serviceToken = req.headers['x-service-token'] as string;
    return serviceToken || req.ip || 'unknown';
  },
});

/**
 * Rate limiter para endpoints de processamento pesado (áudio, OCR, geração de documentos)
 * Mais restritivo para evitar sobrecarga.
 * Usa service token como chave quando disponível (evita conflito de IP em proxies compartilhados).
 */
export const heavyProcessingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requisições por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    erro: 'Limite de processamento atingido. Aguarde antes de enviar mais arquivos.',
    codigo: 'PROCESSING_LIMIT_EXCEEDED',
  },
  handler: (req, res, next, options) => {
    logger.warn('Limite de processamento excedido', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    const serviceToken = req.headers['x-service-token'] as string;
    return serviceToken || req.ip || 'unknown';
  },
});

/**
 * Rate limiter para batch processing
 */
export const batchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // 5 batches por 5 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    erro: 'Limite de processamento em batch atingido.',
    codigo: 'BATCH_LIMIT_EXCEEDED',
  },
});

/**
 * Rate limiter relaxado para health checks
 */
export const healthCheckLimiter = rateLimit({
  windowMs: 1000, // 1 segundo
  max: 10,
  standardHeaders: false,
  legacyHeaders: false,
});
