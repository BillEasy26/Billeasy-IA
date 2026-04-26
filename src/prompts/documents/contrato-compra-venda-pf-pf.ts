import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE COMPRA E VENDA entre duas pessoas físicas.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CPFs, valores ou datas.
2. Linguagem formal e técnica, adequada a contrato de compra e venda.
3. Valores em Real (R$), com duas casas decimais e por extenso quando possível.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX quando exibido no texto.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA COMPRA E VENDA

- Entrega: prazo, local e condições de entrega do bem
- Vícios: garantia contra vícios ocultos e aparentes (art. 441 CC)
- Transferência de risco: momento em que o risco passa ao comprador
- Forma de pagamento: à vista ou parcelado com condições definidas
- Inadimplemento: multa e rescisão em caso de não pagamento

## VARIÁVEIS FORNECIDAS

Vendedor: {{credor_nome}} — CPF: {{credor_cpf}}
Comprador: {{devedor_nome}} — CPF: {{devedor_cpf}}
Descrição do bem: {{descricao_bem}}
Valor total: R$ {{valor_total}}
Forma de pagamento: {{forma_pagamento}}
Prazo de entrega: {{prazo_entrega}}
Data do contrato: {{data_documento}}
Multa por inadimplemento: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio do vendedor.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS. O documento termina após a cláusula de foro.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, excluir garantia legal contra vícios, incluir cláusulas abusivas.
Obrigatório: incluir todas as cláusulas do Núcleo Digital e referência ao CPC art. 784, §4º.`;

export const contratoCompraVendaPfPf: PromptCatalogEntry = {
  id: 'contrato-compra-venda-pf-pf',
  tipoDocumento: 'CONTRATO_COMPRA_VENDA',
  tipoRelacao: 'PF_PF',
  dominio: 'MERCADORIA',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_nome',
    'devedor_cpf',
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
