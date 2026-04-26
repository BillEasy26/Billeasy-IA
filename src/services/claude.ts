// ===========================================
// Serviço: Claude AI - Extração de Dívidas
// ===========================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { MULTI_DEBT_EXTRACTION_PROMPT, buildExtractionPrompt } from '../prompts/debt-extraction.js';
import type {
  DebtExtractionResult,
  ExtractedDebt,
  ConfidenceLevel,
  ProcessingMetrics,
} from '../types/index.js';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

// Mapeamento de score numérico para nível de confiança
function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'ALTA';
  if (score >= 0.7) return 'MEDIA';
  if (score >= 0.5) return 'BAIXA';
  return 'MUITO_BAIXA';
}

// Calcula confiança geral baseada nos campos extraídos
function calculateOverallConfidence(debt: ExtractedDebt): number {
  const weights = {
    nomeDevedor: 0.25,
    cpfCnpj: 0.15,
    valorPrincipal: 0.25,
    descricao: 0.15,
    dataVencimento: 0.10,
    nomeCredor: 0.10,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  if (debt.nomeDevedor.valor) {
    weightedSum += debt.nomeDevedor.confianca * weights.nomeDevedor;
    totalWeight += weights.nomeDevedor;
  }

  if (debt.cpfCnpj?.valor) {
    weightedSum += (debt.cpfCnpj.confianca || 0) * weights.cpfCnpj;
    totalWeight += weights.cpfCnpj;
  }

  if (debt.valorPrincipal.valor) {
    weightedSum += debt.valorPrincipal.confianca * weights.valorPrincipal;
    totalWeight += weights.valorPrincipal;
  }

  if (debt.descricao.valor) {
    weightedSum += debt.descricao.confianca * weights.descricao;
    totalWeight += weights.descricao;
  }

  if (debt.dataVencimento?.valor) {
    weightedSum += (debt.dataVencimento.confianca || 0) * weights.dataVencimento;
    totalWeight += weights.dataVencimento;
  }

  if (debt.nomeCredor?.valor) {
    weightedSum += (debt.nomeCredor.confianca || 0) * weights.nomeCredor;
    totalWeight += weights.nomeCredor;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export async function extractDebtsFromText(
  text: string,
  contexto?: string
): Promise<DebtExtractionResult> {
  const startTime = Date.now();

  try {
    logger.info('Iniciando extração de dívidas via Claude', {
      textLength: text.length,
      hasContexto: !!contexto,
    });

    const prompt = buildExtractionPrompt(text, contexto);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: MULTI_DEBT_EXTRACTION_PROMPT,
    });

    const processingTime = Date.now() - startTime;

    // Extrai o conteúdo da resposta
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Resposta do Claude não é texto');
    }

    // Parse do JSON retornado
    let extractedData: { dividas: ExtractedDebt[]; observacoes?: string };
    try {
      // Remove possíveis blocos de código markdown
      const jsonText = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      logger.error('Erro ao fazer parse da resposta do Claude', {
        response: content.text,
        error: parseError,
      });
      throw new Error('Falha ao processar resposta do Claude');
    }

    // Calcula métricas e níveis de confiança
    const dividas = extractedData.dividas.map((divida) => {
      const overallScore = calculateOverallConfidence(divida);
      return {
        ...divida,
        confiancaGeral: {
          score: overallScore,
          nivel: getConfidenceLevel(overallScore),
        },
      };
    });

    // Confiança geral da extração
    const avgConfidence =
      dividas.length > 0
        ? dividas.reduce((sum, d) => sum + d.confiancaGeral.score, 0) / dividas.length
        : 0;

    const metrics: ProcessingMetrics = {
      tempoProcessamento: processingTime,
      tokensUsados: response.usage.input_tokens + response.usage.output_tokens,
      modelo: 'claude-sonnet-4-20250514',
    };

    const result: DebtExtractionResult = {
      sucesso: true,
      dividas,
      confiancaGeral: {
        score: avgConfidence,
        nivel: getConfidenceLevel(avgConfidence),
      },
      observacoes: extractedData.observacoes,
      metricas: metrics,
    };

    logger.info('Extração de dívidas concluída', {
      quantidadeDividas: dividas.length,
      confiancaGeral: result.confiancaGeral.nivel,
      processingTime: `${processingTime}ms`,
      tokensUsados: metrics.tokensUsados,
    });

    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Erro na extração de dívidas', { error, processingTime });

    return {
      sucesso: false,
      dividas: [],
      confiancaGeral: { score: 0, nivel: 'MUITO_BAIXA' },
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      metricas: {
        tempoProcessamento: processingTime,
        tokensUsados: 0,
        modelo: 'claude-sonnet-4-20250514',
      },
    };
  }
}

// Função para validar e enriquecer dados extraídos
export async function validateExtractedDebt(
  debt: ExtractedDebt,
  additionalContext?: string
): Promise<{
  valido: boolean;
  sugestoes: string[];
  dadosCorrigidos?: Partial<ExtractedDebt>;
}> {
  const sugestoes: string[] = [];

  // Validações básicas
  if (!debt.nomeDevedor.valor || debt.nomeDevedor.confianca < 0.5) {
    sugestoes.push('Nome do devedor não identificado com clareza. Por favor, confirme.');
  }

  if (!debt.valorPrincipal.valor || debt.valorPrincipal.confianca < 0.7) {
    sugestoes.push('Valor da dívida precisa ser confirmado.');
  }

  if (!debt.descricao.valor || debt.descricao.confianca < 0.5) {
    sugestoes.push('Descrição/título da dívida não está clara.');
  }

  // CPF/CNPJ opcional mas importante
  if (!debt.cpfCnpj?.valor) {
    sugestoes.push('CPF/CNPJ do devedor não foi identificado. Recomenda-se informar para registro.');
  }

  const valido = sugestoes.length === 0;

  return {
    valido,
    sugestoes,
  };
}

// Função para processar múltiplos textos em batch
export async function extractDebtsFromBatch(
  texts: Array<{ id: string; texto: string; contexto?: string }>
): Promise<Map<string, DebtExtractionResult>> {
  const results = new Map<string, DebtExtractionResult>();

  logger.info('Iniciando processamento em batch', { quantidade: texts.length });

  // Processa em paralelo com limite de concorrência
  const CONCURRENCY_LIMIT = 3;
  const chunks: typeof texts[] = [];

  for (let i = 0; i < texts.length; i += CONCURRENCY_LIMIT) {
    chunks.push(texts.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (item) => {
      const result = await extractDebtsFromText(item.texto, item.contexto);
      results.set(item.id, result);
    });

    await Promise.all(promises);
  }

  logger.info('Processamento em batch concluído', {
    total: texts.length,
    sucesso: Array.from(results.values()).filter((r) => r.sucesso).length,
  });

  return results;
}
