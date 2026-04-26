/**
 * Schema de validação do resultado de classificação.
 * Garante que o output do Claude está no formato esperado.
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

// PJ_PF é aceito e normalizado para PF_PJ no classifier (credor PJ + devedor PF = mesmo template)
const tipoRelacaoSchema = z.enum(['PF_PF', 'PF_PJ', 'PJ_PJ', 'PJ_PF']);

const dominioContratoSchema = z.enum([
  'IMOVEL',
  'VEICULO',
  'MERCADORIA',
  'SERVICO',
  'FINANCEIRO',
  'OUTRO',
]);

export { tipoDocumentoSchema, tipoRelacaoSchema, dominioContratoSchema };

const faseCobrancaSchema = z.enum(['AMIGAVEL', 'PRE_JURIDICO', 'JURIDICO']);

export const classifyExtractOutputSchema = z.object({
  tipoDocumento: tipoDocumentoSchema.nullable(), // nullable como safety net; prompt garante valor
  tipoRelacao: tipoRelacaoSchema.nullable(),     // nullable como safety net; prompt garante valor
  dominioContrato: dominioContratoSchema.optional().nullable(),
  dados: z.record(z.unknown()),
  confianca: z.number().min(0).max(1),
  camposInferidos: z.array(z.string()).optional(), // campos que foram inferidos (não explícitos)
  faseCobranca: faseCobrancaSchema.optional().nullable(),
  requerConfissao: z.boolean().optional().nullable(),
  urgenciaProtesto: z.boolean().optional().nullable(),
  tituloExecutivoPotencial: z.boolean().optional().nullable(),
});

export type ClassifyExtractOutput = z.infer<typeof classifyExtractOutputSchema>;
