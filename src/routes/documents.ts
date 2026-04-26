// ===========================================
// Rotas: Geração de Documentos com IA
// ===========================================

import { Router } from 'express';
import { z } from 'zod';
import { classifyAndExtract } from '../services/document-classifier.js';
import { generateDocumentFromText } from '../services/document-generator.js';
import { promptCatalog } from '../prompts/catalog/index.js';
import { heavyProcessingLimiter } from '../middleware/rate-limit.js';
import type {
  ClassificationResult,
  GenerationResult,
  TipoDocumento,
  TipoRelacao,
} from '../prompts/catalog/types.js';
import {
  tipoDocumentoSchema,
  tipoRelacaoSchema,
  dominioContratoSchema,
} from '../prompts/classification/schema.js';
import { logger } from '../utils/logger.js';

// nullish() = optional + nullable. O backend Java serializa campos Java `null`
// como JSON `null` (Jackson default); Zod `.optional()` sozinho rejeitaria.
const hintsSchema = z.object({
  tipoDocumentoHint: tipoDocumentoSchema.nullish(),
  tipoRelacaoHint: tipoRelacaoSchema.nullish(),
  dominioContratoHint: dominioContratoSchema.nullish(),
});

const router = Router();

/**
 * POST /api/documents/classify
 * Classifica o texto e extrai dados estruturados.
 */
router.post('/classify', heavyProcessingLimiter, async (req, res) => {
  const { texto } = req.body as { texto?: unknown };

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

  try {
    const result: ClassificationResult = await classifyAndExtract(texto);

    return res.json({
      sucesso: true,
      dados: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const isClassificacaoFalhou = message.includes('CLASSIFICACAO_FALHOU');

    logger.error('Erro na rota /documents/classify', { error });

    return res.status(500).json({
      sucesso: false,
      erro: message,
      codigoErro: isClassificacaoFalhou ? 'CLASSIFICACAO_FALHOU' : undefined,
    });
  }
});

/**
 * POST /api/documents/generate
 * Recebe texto livre, classifica e gera documento.
 *
 * Body:
 *   - texto: string (obrigatório, mín. 10 chars)
 *   - tipoDocumentoHint?: enum — sobrescreve classificação automática
 *   - tipoRelacaoHint?: enum — sobrescreve classificação automática
 *   - dominioContratoHint?: enum — sobrescreve classificação automática
 *   - dados?: Record<string, unknown> — variáveis pré-preenchidas (credor_nome,
 *     valor_total, etc.). Quando presentes, têm precedência sobre o que o Claude
 *     extrair do texto. Usado pelo backend Java que já tem os dados estruturados.
 */
router.post('/generate', heavyProcessingLimiter, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const texto = body.texto;

  if (!texto || typeof texto !== 'string') {
    return res.status(400).json({
      sucesso: false,
      erro: 'Texto não informado ou inválido',
    });
  }

  if (texto.trim().length < 10) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Texto muito curto para geração de documento',
    });
  }

  // Hints são opcionais mas se vierem precisam ser válidos contra os enums.
  const hintsParse = hintsSchema.safeParse({
    tipoDocumentoHint: body.tipoDocumentoHint,
    tipoRelacaoHint: body.tipoRelacaoHint,
    dominioContratoHint: body.dominioContratoHint,
  });
  if (!hintsParse.success) {
    return res.status(400).json({
      sucesso: false,
      codigoErro: 'HINTS_INVALIDOS',
      erro: 'Hints de classificação inválidos',
      detalhes: hintsParse.error.flatten().fieldErrors,
    });
  }
  // nullish() no schema aceita null/undefined — normaliza null→undefined
  // para casar com o tipo ClassificationHints (que só prevê undefined).
  const rawTipoRelacao = hintsParse.data.tipoRelacaoHint ?? undefined;
  // Normaliza PJ_PF → PF_PJ (mesma regra do document-classifier, credor PJ + devedor PF
  // usa o mesmo template do catálogo que só tem PF_PJ/PF_PF/PJ_PJ).
  const tipoRelacaoHint = rawTipoRelacao === 'PJ_PF' ? 'PF_PJ' : rawTipoRelacao;

  const hints = {
    tipoDocumento: hintsParse.data.tipoDocumentoHint ?? undefined,
    tipoRelacao: tipoRelacaoHint as TipoRelacao | undefined,
    dominioContrato: hintsParse.data.dominioContratoHint ?? undefined,
  };

  // Dados estruturados opcionais — quando presentes, substituem a extração
  // do Claude. Deve ser um objeto plano de chaves:valor.
  let dados: Record<string, unknown> | undefined;
  if (body.dados !== undefined && body.dados !== null) {
    if (typeof body.dados !== 'object' || Array.isArray(body.dados)) {
      return res.status(400).json({
        sucesso: false,
        codigoErro: 'HINTS_INVALIDOS',
        erro: 'Campo "dados" precisa ser um objeto',
      });
    }
    dados = body.dados as Record<string, unknown>;
  }

  try {
    const result: GenerationResult = await generateDocumentFromText(texto, hints, dados);

    if (!result.sucesso) {
      return res.status(400).json({
        sucesso: false,
        erro: result.erro,
        codigoErro: result.codigoErro,
        dadosUtilizados: result.dadosUtilizados,
        dadosFaltantes: result.dadosFaltantes,
      });
    }

    return res.json({
      sucesso: true,
      documento: result.documento,
      metadata: {
        promptId: result.promptId,
        promptVersion: result.promptVersion,
        scoreJuridico: result.scoreJuridico,
        clausulasAusentes: result.clausulasAusentes,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';

    logger.error('Erro na rota /documents/generate', { error });

    return res.status(500).json({
      sucesso: false,
      erro: message,
    });
  }
});

/**
 * GET /api/documents/catalog
 * Lista os prompts disponíveis no catálogo.
 */
router.get('/catalog', (_req, res) => {
  const itens = promptCatalog.list();

  return res.json({
    sucesso: true,
    dados: itens,
  });
});

export default router;

