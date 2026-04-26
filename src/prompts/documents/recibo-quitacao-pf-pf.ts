import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um RECIBO DE QUITAÇÃO entre duas pessoas físicas,
comprovando que determinada obrigação foi integralmente paga.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CPFs, valores ou datas.
2. Linguagem formal e objetiva, adequada a documento de quitação.
3. Valores em Real (R$), com duas casas decimais e, quando possível, valor por extenso.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX quando exibido no texto.

## ESTRUTURA DO DOCUMENTO

1. Título: RECIBO DE QUITAÇÃO
2. Identificação das partes: CREDOR e DEVEDOR com nome completo e CPF
3. Descrição da obrigação quitada (origem da dívida)
4. Valor pago, forma de pagamento e data do pagamento
5. Declaração expressa de quitação integral, limitada à obrigação descrita
6. Cláusula de limitação de escopo
7. Local e data de emissão

## VARIÁVEIS FORNECIDAS

Credor: {{credor_nome}} — CPF: {{credor_cpf}}
Devedor: {{devedor_nome}} — CPF: {{devedor_cpf}}
Valor pago: R$ {{valor_pago}}
Data do pagamento: {{data_pagamento}}
Descrição da obrigação: {{descricao_divida}}
Forma de pagamento: {{forma_pagamento}}
Local de emissão: {{local_pagamento}}

${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, registre o local e data de emissão. Sem foro para recibo de quitação.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, incluir renúncias amplas de direitos ou quitação geral
além da obrigação descrita. Não incluir dados sensíveis além dos necessários.`;

export const reciboQuitacaoPfPf: PromptCatalogEntry = {
  id: 'recibo-quitacao-pf-pf',
  tipoDocumento: 'RECIBO_QUITACAO',
  tipoRelacao: 'PF_PF',
  dominio: 'FINANCEIRO',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_nome',
    'devedor_cpf',
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
    'Declaração de quitação integral',
    'Limitação de escopo',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Local e data',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
