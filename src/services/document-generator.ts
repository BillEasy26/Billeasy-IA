/**
 * DocumentGenerator — Geração controlada de documentos.
 * Usa APENAS dados extraídos e estruturados; nunca o texto livre do usuário.
 */

import Anthropic from '@anthropic-ai/sdk';
import { classifyAndExtract } from './document-classifier.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type {
  ClassificationResult,
  GenerationResult,
  TipoDocumento,
  TipoRelacao,
  DominioContrato,
} from '../prompts/catalog/types.js';
import { resolvePrompt } from './prompt-resolver.js';
import { validateExtractedData, prepareVariablesForPrompt } from '../prompts/catalog/validate-extracted-data.js';
import { fillPromptVariables } from '../prompts/catalog/fill-variables.js';
import { validateDocument } from './document-validator.js';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

/** Códigos de erro explícitos para o cliente */
export type GenerationErrorCode =
  | 'CLASSIFICACAO_FALHOU'
  | 'DADOS_INSUFICIENTES'
  | 'GERACAO_FALHOU'
  | 'PROMPT_NAO_ENCONTRADO'
  | 'TIMEOUT_IA';

/**
 * Gera documento a partir de classificação já realizada.
 * Valida dados antes de chamar o LLM.
 */
export async function generateDocument(classification: ClassificationResult): Promise<GenerationResult> {
  const startTime = Date.now();

  // 0) Null-check dos campos usados na resolução do prompt.
  // Sem isso, o catálogo levanta PROMPT_NAO_ENCONTRADO genérico com "null / null".
  // A classificação do Claude pode retornar null em texto ambíguo/curto (o schema tem .nullable() como safety net);
  // neste ponto o caller já teve chance de passar hints. Se ainda chegou null, a falha é de classificação.
  if (!classification.tipoDocumento || !classification.tipoRelacao) {
    logger.warn('Classificação incompleta: tipoDocumento/tipoRelacao null', {
      tipoDocumento: classification.tipoDocumento,
      tipoRelacao: classification.tipoRelacao,
    });
    return {
      sucesso: false,
      codigoErro: 'CLASSIFICACAO_FALHOU',
      erro: 'Não foi possível identificar tipo de documento ou relação entre partes. Informe tipoDocumentoHint e tipoRelacaoHint no request para bypass da classificação automática.',
      dadosUtilizados: classification.dados,
    };
  }

  try {
    // 1) Resolve prompt do catálogo, considerando domínio quando disponível
    const promptEntry = resolvePrompt(
      classification.tipoDocumento,
      classification.tipoRelacao,
      classification.dominioContrato
    );

    // 2) Aplica defaults para cláusulas padrão antes da validação
    const dadosComDefaults = applyDocumentDefaults(classification.dados)

    // 3) Valida dados (agora com defaults aplicados)
    const validation = validateExtractedData(
      dadosComDefaults,
      promptEntry.variaveisObrigatorias
    );

    if (!validation.valido) {
      logger.warn('Dados insuficientes para geração', {
        dadosFaltantes: validation.dadosFaltantes,
      });
      return {
        sucesso: false,
        codigoErro: 'DADOS_INSUFICIENTES',
        erro: `Dados insuficientes. Campos faltantes: ${validation.dadosFaltantes.join(', ')}`,
        dadosUtilizados: dadosComDefaults,
        dadosFaltantes: validation.dadosFaltantes,
      };
    }

    // 4) Preenche variáveis no prompt
    const variables = prepareVariablesForPrompt(
      dadosComDefaults,
      promptEntry.variaveisObrigatorias
    );
    const filledPrompt = fillPromptVariables(promptEntry.instrucoes, variables);

    // 5) Chama Claude
    logger.info('Chamando Claude para geração', {
      promptId: promptEntry.id,
      version: promptEntry.version,
    });

    const response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [{ role: 'user', content: filledPrompt }],
      },
      { timeout: 55_000 }
    );

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Resposta do Claude não é texto');
    }

    // 6) Valida qualidade jurídica do documento gerado
    const validacaoJuridica = validateDocument(content.text);

    logger.info('Documento gerado com sucesso', {
      promptId: promptEntry.id,
      duration: `${Date.now() - startTime}ms`,
      scoreJuridico: validacaoJuridica.score,
      aprovado: validacaoJuridica.aprovado,
      clausulasAusentes: validacaoJuridica.clausulasAusentes,
    });

    return {
      sucesso: true,
      documento: content.text,
      promptId: promptEntry.id,
      promptVersion: promptEntry.version,
      dadosUtilizados: variables,
      scoreJuridico: validacaoJuridica.score,
      clausulasAusentes: validacaoJuridica.clausulasAusentes.length > 0
        ? validacaoJuridica.clausulasAusentes
        : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const duration = `${Date.now() - startTime}ms`;

    if (message.startsWith('PROMPT_NAO_ENCONTRADO')) {
      return {
        sucesso: false,
        codigoErro: 'PROMPT_NAO_ENCONTRADO',
        erro: message,
        dadosUtilizados: classification.dados,
      };
    }

    // Timeout explícito do SDK Anthropic (APIConnectionTimeoutError)
    if (message.includes('timeout') || message.includes('timed out') || (error as any)?.status === 408) {
      logger.warn('Timeout na geração de documento', { duration });
      return {
        sucesso: false,
        codigoErro: 'TIMEOUT_IA',
        erro: 'A geração excedeu o tempo limite. Tente novamente.',
        dadosUtilizados: classification.dados,
      };
    }

    logger.error('Erro na geração de documento', { error, duration });

    return {
      sucesso: false,
      codigoErro: 'GERACAO_FALHOU',
      erro: message,
      dadosUtilizados: classification.dados,
    };
  }
}

/**
 * Injeta defaults para campos de cláusulas jurídicas padrão.
 * Só aplica se o campo não foi extraído pelo Claude.
 * Garante que a geração nunca falhe por ausência desses valores boilerplate.
 */
function applyDocumentDefaults(dados: Record<string, unknown>): Record<string, unknown> {
  const hoje = new Date().toLocaleDateString('pt-BR') // "dd/MM/yyyy"
  const defaults: Record<string, unknown> = {
    percentual_multa: '2',
    percentual_multa_rescisoria: '10',
    forma_pagamento: 'PIX',
    data_acordo: hoje,
    data_documento: hoje,
  }
  const result = { ...dados }
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] == null || result[key] === '') {
      result[key] = value
    }
  }
  return result
}

/**
 * Hints opcionais para bypass/override da classificação automática.
 * Quando o caller (backend Java) já sabe o tipo de documento e a relação,
 * passa como hint e a classificação do Claude deixa de ser autoritativa
 * sobre esses campos — extraímos apenas os dados estruturados do texto.
 */
export interface ClassificationHints {
  tipoDocumento?: TipoDocumento;
  tipoRelacao?: TipoRelacao;
  dominioContrato?: DominioContrato;
}

/**
 * Orquestração completa: texto livre → classificação → validação → geração.
 * O texto do usuário NUNCA é usado diretamente no prompt de geração.
 *
 * Quando `hints` são fornecidos, sobrescrevem a classificação do Claude —
 * usado pelo backend Java para determinismo (ex.: sempre CONFISSAO_DIVIDA / PF_PJ).
 *
 * Quando `dados` são fornecidos, complementam/sobrescrevem os dados
 * extraídos do texto. Chaves do `dados` têm precedência — o backend já
 * possui CPF/nome/valor estruturados e não precisa da extração probabilística.
 */
export async function generateDocumentFromText(
  textoEntrada: string,
  hints?: ClassificationHints,
  dados?: Record<string, unknown>,
): Promise<GenerationResult> {
  try {
    const classification = await classifyAndExtract(textoEntrada);
    if (hints?.tipoDocumento) classification.tipoDocumento = hints.tipoDocumento;
    if (hints?.tipoRelacao) classification.tipoRelacao = hints.tipoRelacao;
    if (hints?.dominioContrato) classification.dominioContrato = hints.dominioContrato;
    // Merge: chaves de `dados` (caller) sobrescrevem as extraídas pelo Claude.
    if (dados && Object.keys(dados).length > 0) {
      classification.dados = { ...classification.dados, ...dados };
    }
    return generateDocument(classification);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const isClassificacaoFalhou = message.includes('CLASSIFICACAO_FALHOU');

    logger.error('Erro no fluxo de geração', { error, textoLength: textoEntrada.length });

    return {
      sucesso: false,
      codigoErro: isClassificacaoFalhou ? 'CLASSIFICACAO_FALHOU' : 'GERACAO_FALHOU',
      erro: message,
    };
  }
}
