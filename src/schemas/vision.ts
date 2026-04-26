/**
 * Schema Zod espelhando docs/contracts/ia-vision-extracao.yaml.
 *
 * Usado para:
 * - Validar o output do Claude Vision antes de devolver ao caller
 * - Dar tipos TypeScript estáveis à camada de serviço e rota
 *
 * IMPORTANTE: qualquer mudança aqui DEVE ser feita em conjunto com o YAML
 * (docs/contracts/ia-vision-extracao.yaml) e com os records Java correspondentes.
 */

import { z } from 'zod';

export const CampoExtraidoSchema = z.object({
  valor: z.string(),
  confianca: z.number().min(0).max(1),
});

export const ParteExtraidaSchema = z.object({
  papel: CampoExtraidoSchema,
  nome: CampoExtraidoSchema,
  documento: CampoExtraidoSchema.optional(),
  email: CampoExtraidoSchema.optional(),
  telefone: CampoExtraidoSchema.optional(),
  endereco: CampoExtraidoSchema.optional(),
});

export const CamposContratoSchema = z.object({
  descricaoUsuario: CampoExtraidoSchema.optional(),
  valor: CampoExtraidoSchema.optional(),
  quantidadeParcelas: CampoExtraidoSchema.optional(),
  metodoPagamento: CampoExtraidoSchema.optional(),
  primeiroVencimento: CampoExtraidoSchema.optional(),
});

export const VisionExtractResponseDadosSchema = z.object({
  confiancaGeral: z.number().min(0).max(1),
  paginasProcessadas: z.number().int().min(0),
  campos: CamposContratoSchema,
  partes: z.array(ParteExtraidaSchema),
});

export type CampoExtraido = z.infer<typeof CampoExtraidoSchema>;
export type ParteExtraida = z.infer<typeof ParteExtraidaSchema>;
export type CamposContrato = z.infer<typeof CamposContratoSchema>;
export type VisionExtractResponseDados = z.infer<typeof VisionExtractResponseDadosSchema>;
