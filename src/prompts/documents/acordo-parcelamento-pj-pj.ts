/**
 * Prompt: Acordo de Parcelamento PJ↔PJ
 * Documento formal entre duas pessoas jurídicas.
 *
 * @see docs/prompts/ACORDO_PARCELAMENTO_PJ_PJ.md
 */

import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um ACORDO DE PARCELAMENTO entre duas pessoas jurídicas (empresas), 
formalizando o parcelamento de uma dívida.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CNPJs, valores ou datas.
2. Linguagem formal e técnica, adequada a contrato.
3. Valores em Real (R$), sempre com duas casas decimais.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CNPJ no formato XX.XXX.XXX/XXXX-XX quando exibido no texto.

## ESTRUTURA DO DOCUMENTO

1. Título: ACORDO DE PARCELAMENTO
2. Identificação das partes (CREDOR e DEVEDOR) com razão social e CNPJ
3. Cláusula de objeto (descrição da dívida e acordo de parcelamento)
4. Cláusula de valor e parcelas (valor total, número de parcelas, valor unitário, datas)
5. Cláusula de inadimplemento (multa de {{percentual_multa}}% sobre o valor em atraso, juros de 1% ao mês, rescisão após 30 dias)
6. Cláusula de foro (eleição de foro da comarca do credor)

## VARIÁVEIS FORNECIDAS

{{credor_razao_social}} — CNPJ: {{credor_cnpj}}
{{devedor_razao_social}} — CNPJ: {{devedor_cnpj}}
Valor total: R$ {{valor_total}}
Número de parcelas: {{numero_parcelas}}
Valor da parcela: R$ {{valor_parcela}}
Primeiro vencimento: {{data_primeiro_vencimento}}
Descrição da dívida: {{descricao_divida}}
Data do acordo: {{data_acordo}}
Multa por atraso: {{percentual_multa}}%

${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio do credor.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS. O documento termina após a cláusula de foro.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, usar linguagem informal, incluir cláusulas não solicitadas
que alterem direitos das partes além dos valores informados pelo usuário (juros 1% a.m.).
Não incluir dados sensíveis além dos necessários para o documento.`;

export const acordoParcelamentoPjPj: PromptCatalogEntry = {
  id: 'acordo-parcelamento-pj-pj',
  tipoDocumento: 'ACORDO_PARCELAMENTO',
  tipoRelacao: 'PJ_PJ',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
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
    'percentual_multa',
  ],
  clausulasMinimas: [
    'Identificação das partes',
    'Objeto do acordo',
    'Valor e parcelas',
    'Inadimplemento',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
  metadata: {
    docRef: 'docs/prompts/ACORDO_PARCELAMENTO_PJ_PJ.md',
  },
};
