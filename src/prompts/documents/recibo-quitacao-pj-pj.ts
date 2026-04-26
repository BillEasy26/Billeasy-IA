/**
 * Prompt: Recibo de Quitação PJ↔PJ
 * Documento formal entre duas pessoas jurídicas comprovando quitação integral.
 *
 * @see docs/prompts/RECIBO_QUITACAO_PJ_PJ.md
 */

import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um RECIBO DE QUITAÇÃO entre duas pessoas jurídicas (empresas),
comprovando que determinada obrigação foi integralmente paga.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CNPJs, valores ou datas.
2. Linguagem formal e objetiva, adequada a documento empresarial.
3. Valores em Real (R$), com duas casas decimais e, quando possível, valor por extenso no corpo do texto.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CNPJ no formato XX.XXX.XXX/XXXX-XX quando exibido no texto.

## ESTRUTURA DO DOCUMENTO

1. Título: RECIBO DE QUITAÇÃO
2. Identificação das partes (CREDOR e DEVEDOR) com razão social, CNPJ e, se disponível, endereço.
3. Descrição da obrigação quitada (origem da dívida, número de documento, período de referência).
4. Valor pago, forma de pagamento e data do pagamento.
5. Declaração expressa de quitação integral, limitada à obrigação descrita.
6. Cláusula deixando claro que outras obrigações não descritas não estão abrangidas por este recibo.
7. Local e data de emissão.

## VARIÁVEIS FORNECIDAS

Credor: {{credor_razao_social}} — CNPJ: {{credor_cnpj}}
Devedor: {{devedor_razao_social}} — CNPJ: {{devedor_cnpj}}
Valor pago: R$ {{valor_pago}}
Data do pagamento: {{data_pagamento}}
Descrição da obrigação: {{descricao_divida}}
Forma de pagamento: {{forma_pagamento}}
Local de emissão: {{local_pagamento}}
Número do documento (opcional): {{numero_documento}}
Período de referência (opcional): {{periodo_referencia}}


${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio do credor.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS. O documento termina após a cláusula de foro.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, usar linguagem informal, incluir renúncias amplas de direitos
ou cláusulas de quitação geral além da obrigação descrita. Não incluir dados sensíveis além dos necessários
para o documento.`;

export const reciboQuitacaoPjPj: PromptCatalogEntry = {
  id: 'recibo-quitacao-pj-pj',
  tipoDocumento: 'RECIBO_QUITACAO',
  tipoRelacao: 'PJ_PJ',
  dominio: 'FINANCEIRO',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_razao_social',
    'credor_cnpj',
    'devedor_razao_social',
    'devedor_cnpj',
    'valor_pago',
    'data_pagamento',
    'descricao_divida',
    'forma_pagamento',
    'local_pagamento',
  ],
  clausulasMinimas: [
    'Identificação das partes',
    'Descrição da obrigação quitada',
    'Valor, forma e data do pagamento',
    'Declaração de quitação integral limitada à obrigação descrita',
    'Limitação de escopo da quitação',    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,

    'Local e data',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
  metadata: {
    docRef: 'docs/prompts/RECIBO_QUITACAO_PJ_PJ.md',
  },
};
