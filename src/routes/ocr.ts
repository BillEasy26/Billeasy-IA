// ===========================================
// Rotas: OCR - Extração de Texto de Imagens
// ===========================================

import { Router } from 'express';
import multer from 'multer';
import {
  extractTextFromImage,
  extractTextFromBuffer,
  extractDocumentFields,
} from '../services/tesseract.js';
import { extractDebtsFromText } from '../services/claude.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const router = Router();

// Configuração do Multer para upload de imagens
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
      cb(new Error(`Formato de imagem não suportado: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/ocr/extract
 * Extrai texto de uma imagem
 */
router.post('/extract', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhuma imagem enviada',
      });
    }

    const { buffer, originalname, mimetype } = req.file;

    logger.info('Recebida imagem para OCR', {
      filename: originalname,
      mimetype,
      size: buffer.length,
    });

    // Salva temporariamente para Tesseract processar
    const tempDir = os.tmpdir();
    const ext = path.extname(originalname) || '.png';
    tempFilePath = path.join(tempDir, `ocr_${Date.now()}${ext}`);
    await fs.writeFile(tempFilePath, buffer);

    // Executa OCR
    const result = await extractTextFromImage(tempFilePath);

    // Remove arquivo temporário
    await fs.unlink(tempFilePath);
    tempFilePath = null;

    const processingTime = Date.now() - startTime;

    return res.json({
      sucesso: true,
      dados: {
        texto: result.texto,
        confidence: result.confidence,
        palavrasDetectadas: result.palavras.length,
        linhasDetectadas: result.linhas.length,
      },
      metricas: {
        processingTime,
        ocrDuration: result.duration,
      },
    });
  } catch (error) {
    // Cleanup em caso de erro
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignora erro de cleanup
      }
    }

    logger.error('Erro no OCR', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro no OCR',
    });
  }
});

/**
 * POST /api/ocr/extract-fields
 * Extrai campos específicos de um documento (valores, datas, CPF/CNPJ)
 */
router.post('/extract-fields', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhuma imagem enviada',
      });
    }

    const { buffer, originalname, mimetype } = req.file;

    logger.info('Recebida imagem para extração de campos', {
      filename: originalname,
      mimetype,
    });

    // Salva temporariamente
    const tempDir = os.tmpdir();
    const ext = path.extname(originalname) || '.png';
    tempFilePath = path.join(tempDir, `ocr_fields_${Date.now()}${ext}`);
    await fs.writeFile(tempFilePath, buffer);

    // Extrai campos
    const result = await extractDocumentFields(tempFilePath);

    // Cleanup
    await fs.unlink(tempFilePath);
    tempFilePath = null;

    const processingTime = Date.now() - startTime;

    return res.json({
      sucesso: true,
      dados: {
        texto: result.texto,
        campos: result.campos,
        confidence: result.confidence,
      },
      metricas: {
        processingTime,
      },
    });
  } catch (error) {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignora
      }
    }

    logger.error('Erro na extração de campos', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro na extração',
    });
  }
});

/**
 * POST /api/ocr/extract-and-analyze
 * Extrai texto de imagem E analisa para extrair dívidas
 */
router.post('/extract-and-analyze', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhuma imagem enviada',
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    const contexto = req.body.contexto as string | undefined;

    logger.info('Recebida imagem para OCR e análise', {
      filename: originalname,
      mimetype,
    });

    // Salva temporariamente
    const tempDir = os.tmpdir();
    const ext = path.extname(originalname) || '.png';
    tempFilePath = path.join(tempDir, `ocr_analyze_${Date.now()}${ext}`);
    await fs.writeFile(tempFilePath, buffer);

    // Passo 1: OCR
    const ocrResult = await extractTextFromImage(tempFilePath);

    // Cleanup
    await fs.unlink(tempFilePath);
    tempFilePath = null;

    if (!ocrResult.texto || ocrResult.texto.trim().length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Não foi possível extrair texto da imagem. Verifique a qualidade.',
      });
    }

    // Passo 2: Análise via Claude
    const extracao = await extractDebtsFromText(ocrResult.texto, contexto);

    const processingTime = Date.now() - startTime;

    return res.json({
      sucesso: true,
      dados: {
        ocr: {
          texto: ocrResult.texto,
          confidence: ocrResult.confidence,
        },
        extracao: {
          dividas: extracao.dividas,
          confiancaGeral: extracao.confiancaGeral,
          observacoes: extracao.observacoes,
        },
      },
      metricas: {
        processingTime,
        ocrDuration: ocrResult.duration,
        tokensUsados: extracao.metricas?.tokensUsados,
      },
    });
  } catch (error) {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignora
      }
    }

    logger.error('Erro no OCR e análise', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro no processamento',
    });
  }
});

/**
 * POST /api/ocr/extract-file
 * Extrai texto de uma imagem pelo caminho (uso interno)
 */
router.post('/extract-file', async (req, res) => {
  const startTime = Date.now();

  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Caminho do arquivo não informado',
      });
    }

    // Verifica existência
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        sucesso: false,
        erro: 'Arquivo não encontrado',
      });
    }

    logger.info('Executando OCR em arquivo', { filePath });

    const result = await extractTextFromImage(filePath);

    const processingTime = Date.now() - startTime;

    return res.json({
      sucesso: true,
      dados: {
        texto: result.texto,
        confidence: result.confidence,
        palavrasDetectadas: result.palavras.length,
      },
      metricas: {
        processingTime,
        ocrDuration: result.duration,
      },
    });
  } catch (error) {
    logger.error('Erro no OCR de arquivo', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro no OCR',
    });
  }
});

export default router;
