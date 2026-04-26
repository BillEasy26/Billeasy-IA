import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE PRESTAÇÃO DE SERVIÇOS de pessoa física (contratada) para pessoa jurídica (contratante).

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CPF, CNPJ, valores ou datas.
2. Linguagem formal e técnica, adequada a contrato de serviço.
3. Valores em Real (R$), com duas casas decimais.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX; CNPJ no formato XX.XXX.XXX/XXXX-XX.

## ESTRUTURA DO DOCUMENTO

1. Título: CONTRATO DE PRESTAÇÃO DE SERVIÇOS
2. Qualificação das partes: CONTRATANTE (empresa) e CONTRATADO (pessoa física) com nome/CPF e razão social/CNPJ
3. Natureza autônoma: declaração de que o contratado é profissional autônomo, sem vínculo empregatício
4. Cláusula do objeto: descrição detalhada dos serviços a serem prestados
5. Cláusula do prazo: duração do contrato e data de início
6. Cláusula de remuneração: valor, periodicidade e forma de pagamento
7. Cláusula das obrigações do CONTRATADO
8. Cláusula das obrigações da CONTRATANTE
9. Cláusula de rescisão: condições, aviso prévio e multa rescisória de {{percentual_multa_rescisoria}}% do valor remanescente
10. Eleição de foro

## VARIÁVEIS FORNECIDAS

Contratante: {{credor_razao_social}} — CNPJ: {{credor_cnpj}}
Contratado: {{devedor_nome}} — CPF: {{devedor_cpf}}
Descrição dos serviços: {{descricao_servicos}}
Valor do contrato: R$ {{valor_total}}
Forma de pagamento: {{forma_pagamento}}
Prazo de vigência: {{prazo_vigencia}}
Data de início: {{data_inicio}}
Data do contrato: {{data_documento}}
Multa rescisória: {{percentual_multa_rescisoria}}%


${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio do credor.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS. O documento termina após a cláusula de foro.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, configurar vínculo empregatício implícito, incluir cláusulas abusivas.
Usar exatamente o percentual de multa rescisória informado pelo usuário. Não incluir dados sensíveis desnecessários.`;

export const contratoPrestacaoServicosPfPj: PromptCatalogEntry = {
  id: 'contrato-prestacao-servicos-pf-pj',
  tipoDocumento: 'CONTRATO_PRESTACAO_SERVICOS',
  tipoRelacao: 'PF_PJ',
  dominio: 'SERVICO',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_razao_social',
    'credor_cnpj',
    'devedor_nome',
    'devedor_cpf',
    'descricao_servicos',
    'valor_total',
    'forma_pagamento',
    'prazo_vigencia',
    'data_inicio',
    'data_documento',
    'percentual_multa_rescisoria',
  ],
  clausulasMinimas: [
    'Qualificação das partes',
    'Natureza autônoma',
    'Objeto do contrato',
    'Prazo de vigência',
    'Remuneração e pagamento',
    'Obrigações das partes',
    'Rescisão',    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,

    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
