// ===========================================
// Rotas: Index - Combina todas as rotas
// ===========================================

import { Router } from 'express';
import audioRoutes from './audio.js';
import ocrRoutes from './ocr.js';
import extractRoutes from './extract.js';
import documentsRoutes from './documents.js';
import visionRoutes from './vision-documents.js';

const router = Router();

// Monta as rotas
router.use('/audio', audioRoutes);
router.use('/ocr', ocrRoutes);
router.use('/extract', extractRoutes);
router.use('/documents', documentsRoutes);
router.use('/vision', visionRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'billeasy-ai-service',
  });
});

export default router;
