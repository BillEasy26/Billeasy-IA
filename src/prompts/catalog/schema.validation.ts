/**
 * Validação de prompts do catálogo usando Zod.
 * Garante que cada entrada do catálogo está correta antes de ser carregada.
 */

import { z } from 'zod';

const tipoDocumentoSchema = z.enum([
  'ACORDO_PARCELAMENTO',
  'RECIBO_QUITACAO',
  'NOTIFICACAO_EXTRAJUDICIAL',
  'CONFISSAO_DIVIDA',
  'CONTRATO_PRESTACAO_SERVICOS',
  'CONTRATO_COMPRA_VENDA',
  'CONTRATO_LOCACAO',
  'CONTRATO_PARCERIA_COMERCIAL',
]);

const tipoRelacaoSchema = z.enum(['PF_PF', 'PF_PJ', 'PJ_PJ']);

const dominioContratoSchema = z.enum([
  'IMOVEL',
  'VEICULO',
  'MERCADORIA',
  'SERVICO',
  'FINANCEIRO',
  'OUTRO',
]);

export const promptCatalogEntrySchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  tipoDocumento: tipoDocumentoSchema,
  tipoRelacao: tipoRelacaoSchema,
  dominio: dominioContratoSchema.optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Versão deve ser semantic (ex: 1.0.0)'),
  instrucoes: z.string().min(50, 'Instruções devem ter pelo menos 50 caracteres'),
  variaveisObrigatorias: z.array(z.string()).min(1, 'Pelo menos uma variável obrigatória'),
  clausulasMinimas: z.array(z.string()).optional().default([]),
  restricoes: z.string().min(10, 'Restrições devem ser explícitas'),
  createdAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type PromptCatalogEntrySchema = z.infer<typeof promptCatalogEntrySchema>;

export function validatePromptEntry(entry: unknown): asserts entry is PromptCatalogEntrySchema {
  promptCatalogEntrySchema.parse(entry);
}

export function parsePromptEntry(entry: unknown): PromptCatalogEntrySchema {
  return promptCatalogEntrySchema.parse(entry);
}
