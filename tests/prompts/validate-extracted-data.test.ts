/**
 * Testes da validação de dados extraídos vs variáveis obrigatórias.
 */

import {
  validateExtractedData,
  prepareVariablesForPrompt,
} from '../../src/prompts/catalog/validate-extracted-data.js';

const ACORDO_PJ_PJ_VARS = [
  'credor_razao_social',
  'credor_cnpj',
  'devedor_razao_social',
  'devedor_cnpj',
  'valor_total',
  'numero_parcelas',
  'valor_parcela',
  'data_primeiro_vencimento',
  'descricao_divida',
  'data_acordo',
];

describe('validateExtractedData', () => {
  it('retorna valido quando todos os dados estão presentes', () => {
    const dados = {
      credor_razao_social: 'Empresa Fornecedora Ltda',
      credor_cnpj: '12.345.678/0001-90',
      devedor_razao_social: 'Comércio Cliente S.A.',
      devedor_cnpj: '98.765.432/0001-10',
      valor_total: 50000,
      numero_parcelas: 10,
      valor_parcela: 5000,
      data_primeiro_vencimento: '2026-03-15',
      descricao_divida: 'Compra de mercadorias',
      data_acordo: '2026-02-11',
    };
    const result = validateExtractedData(dados, ACORDO_PJ_PJ_VARS);
    expect(result.valido).toBe(true);
    expect(result.dadosFaltantes).toEqual([]);
  });

  it('retorna dadosFaltantes quando algum campo está ausente', () => {
    const dados = {
      credor_razao_social: 'Empresa A',
      credor_cnpj: '12345678000190',
      devedor_razao_social: 'Empresa B',
      // devedor_cnpj ausente
      valor_total: 10000,
      numero_parcelas: 5,
      valor_parcela: 2000,
      data_primeiro_vencimento: '2026-03-15',
      descricao_divida: 'Dívida',
      data_acordo: '2026-02-11',
    };
    const result = validateExtractedData(dados, ACORDO_PJ_PJ_VARS);
    expect(result.valido).toBe(false);
    expect(result.dadosFaltantes).toContain('devedor_cnpj');
  });

  it('aceita credor_nome como alias de credor_razao_social', () => {
    const dados = {
      credor_nome: 'Empresa Fornecedora', // alias
      credor_cnpj: '12345678000190',
      devedor_razao_social: 'Empresa Cliente',
      devedor_cnpj: '98765432000110',
      valor_total: 10000,
      numero_parcelas: 5,
      valor_parcela: 2000,
      data_primeiro_vencimento: '2026-03-15',
      descricao_divida: 'Dívida',
      data_acordo: '2026-02-11',
    };
    const result = validateExtractedData(dados, ACORDO_PJ_PJ_VARS);
    expect(result.valido).toBe(true);
    expect(result.dadosFaltantes).toEqual([]);
  });

  it('rejeita string vazia como valor inválido', () => {
    const dados = {
      credor_razao_social: '',
      credor_cnpj: '12345678000190',
      devedor_razao_social: 'Empresa B',
      devedor_cnpj: '98765432000110',
      valor_total: 10000,
      numero_parcelas: 5,
      valor_parcela: 2000,
      data_primeiro_vencimento: '2026-03-15',
      descricao_divida: 'Dívida',
      data_acordo: '2026-02-11',
    };
    const result = validateExtractedData(dados, ACORDO_PJ_PJ_VARS);
    expect(result.valido).toBe(false);
    expect(result.dadosFaltantes).toContain('credor_razao_social');
  });

  it('rejeita null e undefined', () => {
    const dados: Record<string, unknown> = {
      credor_razao_social: 'Empresa A',
      credor_cnpj: '12345678000190',
      devedor_razao_social: 'Empresa B',
      devedor_cnpj: null,
      valor_total: 10000,
      numero_parcelas: 5,
      valor_parcela: 2000,
      data_primeiro_vencimento: '2026-03-15',
      descricao_divida: 'Dívida',
      data_acordo: '2026-02-11',
    };
    const result = validateExtractedData(dados, ACORDO_PJ_PJ_VARS);
    expect(result.valido).toBe(false);
    expect(result.dadosFaltantes).toContain('devedor_cnpj');
  });
});

describe('prepareVariablesForPrompt', () => {
  it('retorna variáveis com alias resolvido', () => {
    const dados = {
      credor_nome: 'Empresa A',
      credor_cnpj: '12345678000190',
      devedor_razao_social: 'Empresa B',
      devedor_cnpj: '98765432000110',
      valor_total: 10000,
      numero_parcelas: 5,
      valor_parcela: 2000,
      data_primeiro_vencimento: '2026-03-15',
      descricao_divida: 'Dívida',
      data_acordo: '2026-02-11',
    };
    const vars = prepareVariablesForPrompt(dados, ACORDO_PJ_PJ_VARS);
    expect(vars.credor_razao_social).toBe('Empresa A');
    expect(vars.valor_total).toBe(10000);
  });
});
