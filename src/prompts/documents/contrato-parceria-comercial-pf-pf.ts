import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE PARCERIA COMERCIAL entre duas pessoas físicas.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente dados.
2. Linguagem formal e técnica, adequada a contrato de parceria.
3. Valores em Real (R$) ou percentuais conforme definido pelas partes.
4. Datas no formato dd/mm/aaaa.
5. CPF no formato XXX.XXX.XXX-XX.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA PARCERIA COMERCIAL

- Divisão de receitas/resultados: percentual ou valor fixo para cada parte
- Exclusividade: se há exclusividade de atuação no segmento ou território
- Não concorrência: vedação de atuação concorrente durante e após a parceria
- Obrigações de cada parceiro
- Gestão e prestação de contas
- Rescisão e direitos pós-encerramento

## VARIÁVEIS FORNECIDAS

Parceiro A: {{credor_nome}} — CPF: {{credor_cpf}}
Parceiro B: {{devedor_nome}} — CPF: {{devedor_cpf}}
Objeto da parceria: {{descricao_parceria}}
Divisão de receitas: {{divisao_receitas}}
Exclusividade: {{exclusividade}}
Prazo de vigência: {{prazo_vigencia}}
Data do contrato: {{data_documento}}
Multa rescisória: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio do Parceiro A.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, configurar sociedade irregular, incluir cláusulas abusivas.
Obrigatório: Núcleo Digital e CPC art. 784, §4º.`;

export const contratoParceriaComercialPfPf: PromptCatalogEntry = {
  id: 'contrato-parceria-comercial-pf-pf',
  tipoDocumento: 'CONTRATO_PARCERIA_COMERCIAL',
  tipoRelacao: 'PF_PF',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_nome',
    'devedor_cpf',
    'descricao_parceria',
    'divisao_receitas',
    'exclusividade',
    'prazo_vigencia',
    'data_documento',
    'percentual_multa',
  ],
  clausulasMinimas: [
    'Qualificação das partes',
    'Objeto da parceria',
    'Divisão de receitas e resultados',
    'Obrigações dos parceiros',
    'Exclusividade',
    'Não concorrência',
    'Prestação de contas',
    'Rescisão',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
