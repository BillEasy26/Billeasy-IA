import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um ACORDO DE PARCELAMENTO entre duas pessoas físicas,
formalizando o parcelamento de uma dívida.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CPFs, valores ou datas.
2. Linguagem formal e técnica, adequada a contrato.
3. Valores em Real (R$), sempre com duas casas decimais e por extenso quando possível.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX quando exibido no texto.
${ESTRUTURA_PADRAO_INSTRUCAO}
## VARIÁVEIS FORNECIDAS

{{credor_nome}} — CPF: {{credor_cpf}}
{{devedor_nome}} — CPF: {{devedor_cpf}}
Valor total: R$ {{valor_total}}
Número de parcelas: {{numero_parcelas}}
Valor da parcela: R$ {{valor_parcela}}
Primeiro vencimento: {{data_primeiro_vencimento}}
Descrição da dívida: {{descricao_divida}}
Data do acordo: {{data_acordo}}
Multa por atraso: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: eleição do foro da comarca do domicílio do credor.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS. O documento termina após a cláusula de foro.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, usar linguagem informal, incluir cláusulas não solicitadas
que alterem direitos das partes além dos valores informados pelo usuário (juros 1% a.m.).
Obrigatório: incluir todas as cláusulas do Núcleo Digital e referência ao CPC art. 784, §4º.`;

export const acordoParcelamentoPfPf: PromptCatalogEntry = {
  id: 'acordo-parcelamento-pf-pf',
  tipoDocumento: 'ACORDO_PARCELAMENTO',
  tipoRelacao: 'PF_PF',
  version: '2.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_nome',
    'devedor_cpf',
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
};
