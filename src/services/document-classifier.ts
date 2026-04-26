/**
 * DocumentClassifier — Classificação e extração de dados a partir de texto livre.
 * O input do usuário NUNCA é usado como prompt de geração; apenas classificado e extraído.
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import {
  CLASSIFY_EXTRACT_SYSTEM,
  buildClassifyExtractPrompt,
} from '../prompts/classification/classify-extract.prompt.js';
import {
  classifyExtractOutputSchema,
  type ClassifyExtractOutput,
} from '../prompts/classification/schema.js';
import type {
  ClassificationResult,
  TipoDocumento,
  TipoRelacao,
  DominioContrato,
} from '../prompts/catalog/types.js';
import { promptCatalog } from '../prompts/catalog/index.js';
import { validateExtractedData } from '../prompts/catalog/validate-extracted-data.js';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

/**
 * Classifica o texto e extrai dados estruturados.
 * @throws Error se a classificação falhar ou o JSON for inválido
 */
export async function classifyAndExtract(texto: string): Promise<ClassificationResult> {
  const startTime = Date.now();

  try {
    logger.info('Iniciando classificação e extração', { textLength: texto.length });

    const userPrompt = buildClassifyExtractPrompt(texto);

    const response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: userPrompt }],
        system: CLASSIFY_EXTRACT_SYSTEM,
      },
      { timeout: 30_000 }
    );

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Resposta do Claude não é texto');
    }

    const jsonText = content.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsed: ClassifyExtractOutput;
    try {
      parsed = classifyExtractOutputSchema.parse(JSON.parse(jsonText));
    } catch (parseError) {
      logger.error('Erro ao validar resposta de classificação', {
        response: content.text,
        error: parseError,
      });
      throw new Error('CLASSIFICACAO_FALHOU: Resposta do modelo em formato inválido');
    }

    // Normaliza PJ_PF → PF_PJ: ambos usam o mesmo template (credor PJ + devedor PF)
    const tipoRelacaoNormalizado = parsed.tipoRelacao === 'PJ_PF' ? 'PF_PJ' : parsed.tipoRelacao;

    const result: ClassificationResult = {
      tipoDocumento: parsed.tipoDocumento as TipoDocumento,
      tipoRelacao: tipoRelacaoNormalizado as TipoRelacao,
      dominioContrato: parsed.dominioContrato as DominioContrato | undefined,
      dados: parsed.dados,
      confianca: parsed.confianca,
      faseCobranca: parsed.faseCobranca ?? null,
      requerConfissao: parsed.requerConfissao ?? null,
      urgenciaProtesto: parsed.urgenciaProtesto ?? null,
      tituloExecutivoPotencial: parsed.tituloExecutivoPotencial ?? null,
    };

    // Valida se os dados extraídos atendem às variáveis obrigatórias do prompt alvo
    const promptEntry = promptCatalog.getOptional(
      result.tipoDocumento,
      result.tipoRelacao,
      result.dominioContrato
    );
    if (promptEntry) {
      const validation = validateExtractedData(result.dados, promptEntry.variaveisObrigatorias);
      if (validation.dadosFaltantes.length > 0) {
        result.dadosFaltantes = validation.dadosFaltantes;
      }
    }

    logger.info('Classificação concluída', {
      tipoDocumento: result.tipoDocumento,
      tipoRelacao: result.tipoRelacao,
      confianca: result.confianca,
      dadosFaltantes: result.dadosFaltantes?.length ?? 0,
      duration: `${Date.now() - startTime}ms`,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const duration = `${Date.now() - startTime}ms`;
    if (message.includes('timeout') || message.includes('timed out') || (error as any)?.status === 408) {
      logger.warn('Timeout na classificação', { duration });
      throw new Error('CLASSIFICACAO_FALHOU: Tempo limite excedido. Tente novamente.');
    }
    logger.error('Erro na classificação', { error, duration });
    throw error;
  }
}
