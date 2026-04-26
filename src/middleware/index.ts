// ===========================================
// Middleware: Index - Exporta todos os middlewares
// ===========================================

export { serviceAuth, optionalServiceAuth, apiKeyAuth } from './auth.js';
export {
  defaultRateLimiter,
  heavyProcessingLimiter,
  batchLimiter,
  healthCheckLimiter,
} from './rate-limit.js';
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  Errors,
} from './error-handler.js';
