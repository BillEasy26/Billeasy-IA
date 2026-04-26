import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar uma CONFISSÃO DE DÍVIDA de pessoa jurídica (empresa devedora) para pessoa física (credora).

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CPF, CNPJ, valores ou datas.
2. Linguagem formal e técnica, adequada a documento jurídico.
3. Valores em Real (R$), com duas casas decimais e, quando possível, por extenso.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX; CNPJ no formato XX.XXX.XXX/XXXX-XX.

## ESTRUTURA DO DOCUMENTO

1. Título: CONFISSÃO DE DÍVIDA
2. Identificação das partes: CREDOR (pessoa física) e DEVEDOR (empresa) com nome/CPF e razão social/CNPJ
3. Declaração expressa da empresa devedora reconhecendo a dívida (origem e valor)
4. Condições de pagamento conforme dados fornecidos
5. Cláusula de encargos por atraso (multa de {{percentual_multa}}%, juros de 1% ao mês)
6. Cláusula de vencimento antecipado em caso de inadimplemento
7. Eleição de foro

## VARIÁVEIS FORNECIDAS

Credor: {{credor_nome}} — CPF: {{credor_cpf}}
Devedor: {{devedor_razao_social}} — CNPJ: {{devedor_cnpj}}
Valor confessado: R$ {{valor_total}}
Origem da dívida: {{descricao_divida}}
Forma de pagamento: {{forma_pagamento}}
Data do documento: {{data_documento}}
Multa por atraso: {{percentual_multa}}%

${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio do credor.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, incluir taxa de juros acima de 1% a.m.
Usar exatamente o percentual de multa informado pelo usuário. Não incluir renúncias de direitos além do padrão. Não incluir dados sensíveis desnecessários.`;

export const confissaoDividaPfPj: PromptCatalogEntry = {
  id: 'confissao-divida-pf-pj',
  tipoDocumento: 'CONFISSAO_DIVIDA',
  tipoRelacao: 'PF_PJ',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_razao_social',
    'devedor_cnpj',
    'valor_total',
    'descricao_divida',
    'forma_pagamento',
    'data_documento',
    'percentual_multa',
  ],
  clausulasMinimas: [
    'Identificação das partes',
    'Reconhecimento da dívida',
    'Valor e condições de pagamento',
    'Encargos por atraso',
    'Vencimento antecipado',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
