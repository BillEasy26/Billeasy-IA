import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE LOCAÇÃO entre duas pessoas físicas.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente nomes, CPFs, valores ou datas.
2. Linguagem formal e técnica, adequada a contrato de locação.
3. Valores em Real (R$), com duas casas decimais e por extenso quando possível.
4. Datas no formato dd/mm/aaaa no corpo do documento.
5. CPF no formato XXX.XXX.XXX-XX quando exibido no texto.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA LOCAÇÃO

- Posse: transferência de posse ao locatário e obrigações de uso correto
- Conservação: dever de conservar o bem no estado em que recebeu
- Encargos: responsabilidade pelos encargos (IPTU, condomínio, água, energia)
- Devolução: condições de devolução ao final da locação
- Inadimplemento: multa por atraso no aluguel e cláusula de despejo

## VARIÁVEIS FORNECIDAS

Locador (credor): {{credor_nome}} — CPF: {{credor_cpf}}
Locatário (devedor): {{devedor_nome}} — CPF: {{devedor_cpf}}
Descrição do imóvel/bem: {{descricao_bem}}
Valor do aluguel mensal: R$ {{valor_mensal}}
Prazo da locação: {{prazo_locacao}}
Data de início: {{data_inicio}}
Data do contrato: {{data_documento}}
Encargos do locatário: {{encargos}}
Multa por atraso: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do local do imóvel ou domicílio do locador.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS. O documento termina após a cláusula de foro.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, incluir cláusulas que violem a Lei do Inquilinato (Lei 8.245/91).
Obrigatório: incluir todas as cláusulas do Núcleo Digital e referência ao CPC art. 784, §4º.`;

export const contratoLocacaoPfPf: PromptCatalogEntry = {
  id: 'contrato-locacao-pf-pf',
  tipoDocumento: 'CONTRATO_LOCACAO',
  tipoRelacao: 'PF_PF',
  dominio: 'IMOVEL',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_nome',
    'devedor_cpf',
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
    'Inadimplemento e despejo',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
