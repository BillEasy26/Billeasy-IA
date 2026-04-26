import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar uma NOTIFICAÇÃO EXTRAJUDICIAL entre duas pessoas jurídicas (empresas),
formalizando a cobrança de uma dívida antes de medidas judiciais.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CNPJs, valores ou datas.
2. Linguagem formal, clara e intimidatória dentro dos limites legais.
3. Valores em Real (R$), com duas casas decimais.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CNPJ no formato XX.XXX.XXX/XXXX-XX quando exibido no texto.

## ESTRUTURA DO DOCUMENTO

1. Título: NOTIFICAÇÃO EXTRAJUDICIAL
2. Identificação das partes: NOTIFICANTE (credor) e NOTIFICADO (devedor) com razão social e CNPJ
3. Descrição detalhada da dívida (origem, valor, data de vencimento)
4. Interpelação formal: prazo de {{prazo_pagamento}} dias para pagamento
5. Consequências do não pagamento: protesto, inclusão em cadastros de inadimplentes, ação judicial com custas e honorários
6. Forma de pagamento aceita
7. Local, data e identificação do notificante

## VARIÁVEIS FORNECIDAS

Notificante (Credor): {{credor_razao_social}} — CNPJ: {{credor_cnpj}}
Notificado (Devedor): {{devedor_razao_social}} — CNPJ: {{devedor_cnpj}}
Valor da dívida: R$ {{valor_divida}}
Descrição da dívida: {{descricao_divida}}
Data de vencimento: {{data_vencimento}}
Prazo para pagamento: {{prazo_pagamento}} dias
Data da notificação: {{data_notificacao}}


${NUCLEO_UNIVERSAL_INSTRUCOES}
A notificação extrajudicial não possui foro eleito. Encerre após o Núcleo Digital com a identificação do notificante e data.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, fazer ameaças ilegais, incluir cláusulas de renúncia a direitos.
Não incluir dados sensíveis além dos necessários. Manter tom formal e dentro da legalidade.`;

export const notificacaoExtrajudicialPjPj: PromptCatalogEntry = {
  id: 'notificacao-extrajudicial-pj-pj',
  tipoDocumento: 'NOTIFICACAO_EXTRAJUDICIAL',
  tipoRelacao: 'PJ_PJ',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_razao_social',
    'credor_cnpj',
    'devedor_razao_social',
    'devedor_cnpj',
    'valor_divida',
    'descricao_divida',
    'data_vencimento',
    'prazo_pagamento',
    'data_notificacao',
  ],
  clausulasMinimas: [
    'Identificação das partes',
    'Descrição e origem da dívida',
    'Valor e prazo para pagamento',
    'Consequências do inadimplemento',    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,

    'Local e data',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
