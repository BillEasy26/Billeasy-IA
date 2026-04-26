import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE LOCAÇÃO entre pessoa física e pessoa jurídica.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente dados.
2. Linguagem formal e técnica, adequada a contrato de locação.
3. Valores em Real (R$), com duas casas decimais.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX; CNPJ no formato XX.XXX.XXX/XXXX-XX.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA LOCAÇÃO

- Posse: transferência de posse ao locatário
- Conservação: dever de conservar no estado em que recebeu
- Encargos: responsabilidade pelos encargos
- Devolução: condições de devolução ao final da locação
- Inadimplemento: multa por atraso

## VARIÁVEIS FORNECIDAS

{{credor_nome}} — CPF: {{credor_cpf}} (locador)
{{devedor_razao_social}} — CNPJ: {{devedor_cnpj}} (locatário)
Descrição do imóvel/bem: {{descricao_bem}}
Valor do aluguel mensal: R$ {{valor_mensal}}
Prazo da locação: {{prazo_locacao}}
Data de início: {{data_inicio}}
Data do contrato: {{data_documento}}
Encargos do locatário: {{encargos}}
Multa por atraso: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do local do imóvel.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados. Obrigatório: Núcleo Digital e CPC art. 784, §4º.`;

export const contratoLocacaoPfPj: PromptCatalogEntry = {
  id: 'contrato-locacao-pf-pj',
  tipoDocumento: 'CONTRATO_LOCACAO',
  tipoRelacao: 'PF_PJ',
  dominio: 'IMOVEL',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_razao_social',
    'devedor_cnpj',
    'descricao_bem',
    'valor_mensal',
    'prazo_locacao',
    'data_inicio',
    'data_documento',
    'encargos',
    'percentual_multa',
  ],
  clausulasMinimas: [
    'Qualificação das partes',
    'Objeto da locação',
    'Valor e vencimento do aluguel',
    'Posse e uso do bem',
    'Conservação',
    'Encargos',
    'Devolução',
    'Inadimplemento',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
