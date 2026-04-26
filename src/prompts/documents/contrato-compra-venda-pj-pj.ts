import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE COMPRA E VENDA entre duas pessoas jurídicas (empresas).

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CNPJs, valores ou datas.
2. Linguagem formal e técnica, adequada a contrato empresarial de compra e venda.
3. Valores em Real (R$), com duas casas decimais.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CNPJ no formato XX.XXX.XXX/XXXX-XX quando exibido no texto.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA COMPRA E VENDA

- Entrega: prazo, local, condições e nota fiscal
- Vícios: garantia contra vícios ocultos e aparentes
- Transferência de risco: momento em que o risco passa ao comprador
- Forma de pagamento: condições e multa por atraso
- Inadimplemento: vencimento antecipado e rescisão

## VARIÁVEIS FORNECIDAS

Vendedora: {{credor_razao_social}} — CNPJ: {{credor_cnpj}}
Compradora: {{devedor_razao_social}} — CNPJ: {{devedor_cnpj}}
Descrição do bem/mercadoria: {{descricao_bem}}
Valor total: R$ {{valor_total}}
Forma de pagamento: {{forma_pagamento}}
Prazo de entrega: {{prazo_entrega}}
Data do contrato: {{data_documento}}
Multa por inadimplemento: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio da vendedora.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS. O documento termina após a cláusula de foro.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, excluir garantia legal, incluir cláusulas que violem o CC ou o CDC.
Obrigatório: incluir todas as cláusulas do Núcleo Digital e referência ao CPC art. 784, §4º.`;

export const contratoCompraVendaPjPj: PromptCatalogEntry = {
  id: 'contrato-compra-venda-pj-pj',
  tipoDocumento: 'CONTRATO_COMPRA_VENDA',
  tipoRelacao: 'PJ_PJ',
  dominio: 'MERCADORIA',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_razao_social',
    'credor_cnpj',
    'devedor_razao_social',
    'devedor_cnpj',
    'descricao_bem',
    'valor_total',
    'forma_pagamento',
    'prazo_entrega',
    'data_documento',
    'percentual_multa',
  ],
  clausulasMinimas: [
    'Qualificação das partes',
    'Objeto da compra e venda',
    'Valor e forma de pagamento',
    'Entrega',
    'Vícios e garantia',
    'Transferência de risco',
    'Inadimplemento',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
