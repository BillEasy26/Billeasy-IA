// ===========================================
// Rota: Extração de campos de contrato via Claude Vision
// ===========================================

import { Router } from 'express';
import multer from 'multer';
import { extractFromImage } from '../services/vision-document-processor.js';
import { heavyProcessingLimiter } from '../middleware/rate-limit.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.processing.maxFileSizeMB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'application/pdf',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato não suportado: ${file.mimetype}. Aceitos: JPEG, PNG, GIF, BMP, TIFF, WebP, PDF.`));
    }
  },
});

/**
 * POST /api/vision/extract-from-image
 * Extrai campos de contrato alinhados ao BillEasy.
 *
 * Multipart field: "file" (imagem ou PDF)
 *
 * Ver docs/contracts/ia-vision-extracao.yaml para o schema completo.
 */
router.post('/extract-from-image', heavyProcessingLimiter, upload.single('file'), async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhum arquivo enviado. Envie uma imagem ou PDF no campo "file".',
        codigoErro: 'FORMATO_INVALIDO',
      });
    }

    const { buffer, originalname, mimetype } = req.file;

    logger.info('Recebido arquivo para extração Vision', {
      filename: originalname,
      mimetype,
      size: buffer.length,
    });

    const result = await extractFromImage(buffer, mimetype, originalname);

    const processingTime = Date.now() - startTime;

    if (!result.sucesso || !result.dados) {
      return res.status(400).json({
        sucesso: false,
        erro: result.erro ?? 'Falha desconhecida',
        codigoErro: result.codigoErro ?? 'EXTRACAO_FALHOU',
        metricas: { processingTime },
      });
    }

    return res.json({
      sucesso: true,
      dados: result.dados,
      metricas: { processingTime },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Erro na rota /vision/extract-from-image', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro no processamento',
      codigoErro: 'EXTRACAO_FALHOU',
      metricas: { processingTime },
    });
  }
});

export default router;
