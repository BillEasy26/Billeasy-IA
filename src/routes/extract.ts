// ===========================================
// Rotas: Extração de Dívidas via Texto
// ===========================================

import { Router } from 'express';
import {
  extractDebtsFromText,
  validateExtractedDebt,
  extractDebtsFromBatch,
} from '../services/claude.js';
import { billeasyApi } from '../services/billeasy-api.js';
import { prisma } from '../config/database.js';
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

/**
 * POST /api/extract/confirm
 * Confirma e persiste dívida extraída no backend Java
 */
router.post('/confirm', async (req, res) => {
  try {
    const { divida, empresaId, usuarioId } = req.body;

    if (!divida || !empresaId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dados da dívida e empresaId são obrigatórios',
      });
    }

    const extractedDebt = divida as ExtractedDebt;

    logger.info('Confirmando dívida extraída', {
      empresaId,
      nomeDevedor: extractedDebt.nomeDevedor.valor,
    });

    // Passo 1: Criar ou buscar devedor
    let devedorId: string;

    // Verifica se devedor já existe (por nome na empresa) - LEITURA via Prisma
    const devedorExistente = await prisma.devedor.findFirst({
      where: {
        empresaId,
        nome: {
          contains: extractedDebt.nomeDevedor.valor,
          mode: 'insensitive',
        },
      },
    });

    if (devedorExistente) {
      devedorId = devedorExistente.id;
      logger.info('Devedor existente encontrado', { devedorId });
    } else {
      // Cria novo devedor via API Java (ESCRITA)
      const createResult = await billeasyApi.createDevedor({
        nome: extractedDebt.nomeDevedor.valor,
        cpfCnpj: extractedDebt.cpfCnpj?.valor,
        email: extractedDebt.email?.valor,
        telefone: extractedDebt.telefone?.valor,
        empresaId,
      });

      if (!createResult.success || !createResult.data) {
        return res.status(500).json({
          sucesso: false,
          erro: `Falha ao criar devedor: ${createResult.error}`,
        });
      }

      devedorId = createResult.data.id;
      logger.info('Novo devedor criado', { devedorId });
    }

    // Passo 2: Criar dívida via API Java
    const dividaResult = await billeasyApi.createDivida({
      descricao: extractedDebt.descricao.valor,
      valorPrincipal: parseFloat(
        extractedDebt.valorPrincipal.valor.replace(/[^\d,.-]/g, '').replace(',', '.')
      ),
      dataVencimento: extractedDebt.dataVencimento?.valor,
      devedorId,
      empresaId,
    });

    if (!dividaResult.success || !dividaResult.data) {
      return res.status(500).json({
        sucesso: false,
        erro: `Falha ao criar dívida: ${dividaResult.error}`,
      });
    }

    logger.info('Dívida criada com sucesso', {
      dividaId: dividaResult.data.id,
      devedorId,
    });

    return res.json({
      sucesso: true,
      dados: {
        dividaId: dividaResult.data.id,
        devedorId,
      },
    });
  } catch (error) {
    logger.error('Erro ao confirmar dívida', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro ao confirmar',
    });
  }
});

/**
 * GET /api/extract/devedores/:empresaId
 * Lista devedores de uma empresa (LEITURA via Prisma)
 */
router.get('/devedores/:empresaId', async (req, res) => {
  try {
    const { empresaId } = req.params;
    const { search, limit = '20' } = req.query;

    const devedores = await prisma.devedor.findMany({
      where: {
        empresaId,
        status: 'ATIVO',
        ...(search && {
          nome: {
            contains: search as string,
            mode: 'insensitive',
          },
        }),
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        _count: {
          select: { dividas: true },
        },
      },
      take: parseInt(limit as string, 10),
      orderBy: { nome: 'asc' },
    });

    return res.json({
      sucesso: true,
      dados: devedores,
    });
  } catch (error) {
    logger.error('Erro ao listar devedores', { error });

    return res.status(500).json({
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro ao listar',
    });
  }
});

export default router;
