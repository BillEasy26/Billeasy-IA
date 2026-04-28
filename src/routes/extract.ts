// ===========================================
// Rotas: Extração de Dívidas via Texto
// ===========================================

import { Router } from 'express';
import {
  extractDebtsFromText,
  validateExtractedDebt,
  extractDebtsFromBatch,
} from '../services/claude.js';
import { logger } from '../utils/logger.js';
import type { ExtractedDebt } from '../types/index.js';

const router = Router();

/**
 * POST /api/extract/text
 * Extrai informações de dívidas de um texto
 */
router.post('/text', async (req, res) => {
  const startTime = Date.now();

  try {
    const { texto, contexto } = req.body;

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({
        sucesso: false,
        erro: 'Texto não informado ou inválido',
      });
    }

    if (texto.trim().length < 10) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Texto muito curto para análise',
      });
    }

    logger.info('Recebido texto para extração', {
      textLength: texto.length,
      hasContexto: !!contexto,
    });

    const result = await extractDebtsFromText(texto, contexto);

    const processingTime = Date.now() - startTime;

    return res.json({
      sucesso: result.sucesso,
      dados: {
        dividas: result.dividas,
        confiancaGeral: result.confiancaGeral,
        observacoes: result.observacoes,
      },
      metricas: {
        processingTime,
        tokensUsados: result.metricas?.tokensUsados,
        modelo: result.metricas?.modelo,
      },
    });
  } catch (error) {
    logger.error('Erro na extração de texto', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro na extração',
    });
  }
});

/**
 * POST /api/extract/validate
 * Valida dados de dívida extraídos
 */
router.post('/validate', async (req, res) => {
  try {
    const { divida } = req.body;

    if (!divida) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dados da dívida não informados',
      });
    }

    const result = await validateExtractedDebt(divida as ExtractedDebt);

    return res.json({
      sucesso: true,
      dados: result,
    });
  } catch (error) {
    logger.error('Erro na validação', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro na validação',
    });
  }
});

/**
 * POST /api/extract/batch
 * Processa múltiplos textos em batch
 */
router.post('/batch', async (req, res) => {
  const startTime = Date.now();

  try {
    const { itens } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Lista de itens não informada ou vazia',
      });
    }

    if (itens.length > 10) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Máximo de 10 itens por batch',
      });
    }

    logger.info('Iniciando processamento em batch', { quantidade: itens.length });

    const results = await extractDebtsFromBatch(
      itens.map((item: { id: string; texto: string; contexto?: string }) => ({
        id: item.id,
        texto: item.texto,
        contexto: item.contexto,
      }))
    );

    const processingTime = Date.now() - startTime;

    // Converte Map para objeto
    const resultados: Record<string, unknown> = {};
    results.forEach((value, key) => {
      resultados[key] = value;
    });

    return res.json({
      sucesso: true,
      dados: {
        resultados,
        total: itens.length,
        processados: results.size,
      },
      metricas: {
        processingTime,
      },
    });
  } catch (error) {
    logger.error('Erro no processamento batch', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro no batch',
    });
  }
});

export default router;
