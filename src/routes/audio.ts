// ===========================================
// Rotas: Transcrição de Áudio (processamento assíncrono)
// ===========================================

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { promises as fsPromises } from 'fs';
import { transcribeAudio } from '../services/whisper.js';
import { extractDebtsFromText } from '../services/claude.js';
import { logger } from '../utils/logger.js';
import { createJob, updateJob, getJob } from '../services/job-store.js';

const router = Router();

// Grava em disco (não em RAM) — evita OOM no Railway para áudios grandes
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `audio-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB — suficiente para qualquer gravação
  },
  fileFilter: (_req, file, cb) => {
    // Aceita áudio/vídeo webm — Chrome às vezes envia video/webm para gravações de áudio
    const isAudio =
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'video/webm' ||
      file.mimetype === 'application/octet-stream';

    if (isAudio) {
      cb(null, true);
    } else {
      cb(new Error(`Formato não suportado: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/audio/transcribe
 * Aceita o áudio, inicia a transcrição em background e retorna imediatamente um jobId.
 * Use GET /api/audio/job/:jobId para verificar o resultado.
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhum arquivo de áudio enviado',
      });
    }

    const { path: filePath, originalname, mimetype, size } = req.file;
    const language = (req.body.language as string) || 'pt';

    logger.info('Áudio recebido, iniciando job assíncrono', {
      filename: originalname,
      mimetype,
      size,
      filePath,
      language,
    });

    const job = createJob();

    // Processa em background — não bloqueia a resposta HTTP
    processTranscricao(job.id, filePath, language).catch((err) => {
      logger.error('Erro inesperado no job de transcrição', { jobId: job.id, err });
      updateJob(job.id, { status: 'failed', erro: 'Erro interno no processamento' });
    });

    return res.status(202).json({
      sucesso: true,
      dados: {
        jobId: job.id,
        status: 'processing',
      },
    });
  } catch (error) {
    logger.error('Erro ao iniciar transcrição', { error });
    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro ao iniciar transcrição',
    });
  }
});

/**
 * POST /api/audio/transcribe-and-extract
 * Aceita o áudio, inicia transcrição + extração de dívidas em background.
 * Use GET /api/audio/job/:jobId para verificar o resultado.
 */
router.post('/transcribe-and-extract', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhum arquivo de áudio enviado',
      });
    }

    const { path: filePath, originalname, mimetype, size } = req.file;
    const language = (req.body.language as string) || 'pt';
    const contexto = req.body.contexto as string | undefined;

    logger.info('Áudio recebido para transcrição+extração, iniciando job assíncrono', {
      filename: originalname,
      mimetype,
      size,
      filePath,
    });

    const job = createJob();

    // Processa em background
    processTranscricaoEExtracao(job.id, filePath, language, contexto).catch((err) => {
      logger.error('Erro inesperado no job de transcrição+extração', { jobId: job.id, err });
      updateJob(job.id, { status: 'failed', erro: 'Erro interno no processamento' });
    });

    return res.status(202).json({
      sucesso: true,
      dados: {
        jobId: job.id,
        status: 'processing',
      },
    });
  } catch (error) {
    logger.error('Erro ao iniciar transcrição+extração', { error });
    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro ao iniciar transcrição',
    });
  }
});

/**
 * GET /api/audio/job/:jobId
 * Consulta o status/resultado de um job de transcrição.
 */
router.get('/job/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({
      sucesso: false,
      erro: 'Job não encontrado ou expirado',
    });
  }

  if (job.status === 'processing') {
    return res.json({
      sucesso: true,
      dados: { jobId, status: 'processing' },
    });
  }

  if (job.status === 'failed') {
    return res.json({
      sucesso: false,
      dados: { jobId, status: 'failed' },
      erro: job.erro || 'Falha no processamento',
    });
  }

  // done
  return res.json({
    sucesso: true,
    dados: { jobId, status: 'done', ...(job.result as Record<string, unknown>) },
  });
});

// ===========================================
// Funções de processamento em background
// ===========================================

async function processTranscricao(
  jobId: string,
  filePath: string,
  language: string
): Promise<void> {
  const startTime = Date.now();
  try {
    const result = await transcribeAudio(filePath, language);
    const processingTime = Date.now() - startTime;

    updateJob(jobId, {
      status: 'done',
      result: {
        texto: result.texto,
        confidence: result.confidence,
        audioDuration: result.duration,
        language: result.language,
        metricas: { processingTime },
      },
    });

    logger.info('Job de transcrição concluído', { jobId, processingTime: `${processingTime}ms` });
  } catch (error) {
    logger.error('Falha no job de transcrição', { jobId, error });
    updateJob(jobId, {
      status: 'failed',
      erro: error instanceof Error ? error.message : 'Erro na transcrição',
    });
  } finally {
    // Limpa o arquivo temporário
    fsPromises.unlink(filePath).catch(() => {});
  }
}

async function processTranscricaoEExtracao(
  jobId: string,
  filePath: string,
  language: string,
  contexto?: string
): Promise<void> {
  const startTime = Date.now();
  try {
    const transcricao = await transcribeAudio(filePath, language);

    if (!transcricao.texto || transcricao.texto.trim().length === 0) {
      updateJob(jobId, {
        status: 'failed',
        erro: 'Não foi possível transcrever o áudio. Tente novamente com áudio mais claro.',
      });
      return;
    }

    const extracao = await extractDebtsFromText(transcricao.texto, contexto);
    const processingTime = Date.now() - startTime;

    updateJob(jobId, {
      status: 'done',
      result: {
        transcricao: {
          texto: transcricao.texto,
          confidence: transcricao.confidence,
          audioDuration: transcricao.duration,
          language: transcricao.language,
        },
        extracao: {
          dividas: extracao.dividas,
          confiancaGeral: extracao.confiancaGeral,
          observacoes: extracao.observacoes,
        },
        metricas: {
          processingTime,
          tokensUsados: extracao.metricas?.tokensUsados,
        },
      },
    });

    logger.info('Job de transcrição+extração concluído', { jobId, processingTime: `${processingTime}ms` });
  } catch (error) {
    logger.error('Falha no job de transcrição+extração', { jobId, error });
    updateJob(jobId, {
      status: 'failed',
      erro: error instanceof Error ? error.message : 'Erro no processamento',
    });
  } finally {
    // Limpa o arquivo temporário
    fsPromises.unlink(filePath).catch(() => {});
  }
}

export default router;
