/**
 * Testes de classificação — validação do schema e parsing.
 */

import { classifyExtractOutputSchema } from '../../src/prompts/classification/schema.js';

describe('classifyExtractOutputSchema', () => {
  it('aceita output válido de ACORDO_PARCELAMENTO PJ_PJ', () => {
    const output = {
      tipoDocumento: 'ACORDO_PARCELAMENTO',
      tipoRelacao: 'PJ_PJ',
      dados: {
        credor_razao_social: 'Empresa A Ltda',
        credor_cnpj: '12.345.678/0001-90',
        devedor_razao_social: 'Empresa B S.A.',
        devedor_cnpj: '98.765.432/0001-10',
        valor_total: 10000,
        numero_parcelas: 5,
        valor_parcela: 2000,
        data_primeiro_vencimento: '2026-03-15',
        descricao_divida: 'Compra de mercadorias',
        data_acordo: '2026-02-11',
      },
      confianca: 0.9,
    };
    const result = classifyExtractOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it('rejeita tipoDocumento inválido', () => {
    const output = {
      tipoDocumento: 'DOCUMENTO_INEXISTENTE',
      tipoRelacao: 'PJ_PJ',
      dados: {},
      confianca: 0.8,
    };
    const result = classifyExtractOutputSchema.safeParse(output);
    expect(result.success).toBe(false);
  });

  it('rejeita confianca fora do intervalo 0-1', () => {
    const output = {
      tipoDocumento: 'ACORDO_PARCELAMENTO',
      tipoRelacao: 'PJ_PJ',
      dados: {},
      confianca: 1.5,
    };
    const result = classifyExtractOutputSchema.safeParse(output);
    expect(result.success).toBe(false);
  });

  it('aceita dados vazios (extração parcial)', () => {
    const output = {
      tipoDocumento: 'ACORDO_PARCELAMENTO',
      tipoRelacao: 'PJ_PJ',
      dados: { valor_total: 10000 },
      confianca: 0.6,
    };
    const result = classifyExtractOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
  });
});
