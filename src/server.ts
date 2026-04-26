// ===========================================
// BillEasy AI Service - Servidor Principal
// ===========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/database.js';
import routes from './routes/index.js';
import { registerDocumentPrompts } from './prompts/documents/index.js';
import {
  serviceAuth,
  defaultRateLimiter,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';

const app = express();

// ===========================================
// Middlewares Globais
// ===========================================

// Segurança
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitado pois é uma API
}));

// CORS
const allowedOrigins = config.isDev
  ? true // permite qualquer origem em dev
  : [
      'https://billeasy.com.br',
      'https://www.billeasy.com.br',
      'https://billeasy.vercel.app',
      'https://billeasy-frontend.vercel.app',
      'https://bill-easy-v1.vercel.app',
      'https://billeasy-backend.onrender.com',
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
    ];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Token', 'X-Api-Key'],
}));

// Compressão
app.use(compression());

// Parse JSON e URL-encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Confia no proxy reverso (nginx/load balancer) para ler o IP real do X-Forwarded-For
app.set('trust proxy', 1);

// Rate limiting global
app.use(defaultRateLimiter);

// Log de requisições
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Requisição processada', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
});

// ===========================================
// Health Check (sem autenticação)
// ===========================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'billeasy-ai-service',
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

app.get('/ready', async (_req, res) => {
  try {
    // Verifica conexão com banco
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
      },
    });
  } catch (error) {
    logger.error('Readiness check falhou', { error });

    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'failed',
      },
    });
  }
});

// ===========================================
// Rotas da API (com autenticação)
// ===========================================

app.use('/api', serviceAuth, routes);

// ===========================================
// Error Handlers
// ===========================================

app.use(notFoundHandler);
app.use(errorHandler);

// ===========================================
// Inicialização do Servidor
// ===========================================

async function startServer() {
  try {
    // Registra prompts do catálogo de documentos
    registerDocumentPrompts();
    logger.info('Catálogo de prompts carregado');

    // Testa conexão com banco
    logger.info('Conectando ao banco de dados...');
    await prisma.$connect();
    logger.info('Conexão com banco de dados estabelecida');

    // Inicia servidor
    const server = app.listen(config.port, () => {
      logger.info(`🚀 BillEasy AI Service iniciado`, {
        port: config.port,
        environment: config.nodeEnv,
        url: `http://localhost:${config.port}`,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Recebido sinal ${signal}, iniciando shutdown...`);

      server.close(async () => {
        logger.info('Servidor HTTP fechado');

        await prisma.$disconnect();
        logger.info('Conexão com banco de dados fechada');

        process.exit(0);
      });

      // Força shutdown após 10 segundos
      setTimeout(() => {
        logger.error('Shutdown forçado após timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Falha ao iniciar servidor', { error });
    process.exit(1);
  }
}

startServer();

export default app;
