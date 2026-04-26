import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar uma NOTIFICAÇÃO EXTRAJUDICIAL entre duas pessoas físicas,
formalizando a cobrança de uma dívida antes de medidas judiciais.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CPFs, valores ou datas.
2. Linguagem formal, clara e dentro dos limites legais.
3. Valores em Real (R$), com duas casas decimais.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX quando exibido no texto.

## ESTRUTURA DO DOCUMENTO

1. Título: NOTIFICAÇÃO EXTRAJUDICIAL
2. Identificação das partes: NOTIFICANTE (credor) e NOTIFICADO (devedor) com nome e CPF
3. Descrição detalhada da dívida (origem, valor, data de vencimento)
4. Interpelação formal: prazo de {{prazo_pagamento}} dias para pagamento
5. Consequências do não pagamento: protesto, inclusão em cadastros de inadimplentes, ação judicial com custas e honorários
6. Forma de pagamento aceita
7. Local, data e identificação do notificante

## VARIÁVEIS FORNECIDAS

Notificante (Credor): {{credor_nome}} — CPF: {{credor_cpf}}
Notificado (Devedor): {{devedor_nome}} — CPF: {{devedor_cpf}}
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

export const notificacaoExtrajudicialPfPf: PromptCatalogEntry = {
  id: 'notificacao-extrajudicial-pf-pf',
  tipoDocumento: 'NOTIFICACAO_EXTRAJUDICIAL',
  tipoRelacao: 'PF_PF',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_nome',
    'devedor_cpf',
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
    'Consequências do inadimplemento',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Local e data',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
