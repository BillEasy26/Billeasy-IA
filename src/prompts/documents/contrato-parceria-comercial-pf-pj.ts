import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE PARCERIA COMERCIAL entre pessoa física e pessoa jurídica.

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente dados.
2. Linguagem formal e técnica.
3. Valores em Real (R$) ou percentuais.
4. Datas no formato dd/mm/aaaa.
5. CPF: XXX.XXX.XXX-XX; CNPJ: XX.XXX.XXX/XXXX-XX.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA PARCERIA COMERCIAL

- Divisão de receitas/resultados
- Exclusividade de atuação
- Não concorrência
- Obrigações de cada parceiro
- Prestação de contas
- Rescisão e direitos pós-encerramento

## VARIÁVEIS FORNECIDAS

{{credor_nome}} — CPF: {{credor_cpf}} (Parceiro A)
{{devedor_razao_social}} — CNPJ: {{devedor_cnpj}} (Parceiro B)
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

const RESTRICOES = `Proibido: inventar dados, configurar sociedade irregular.
Obrigatório: Núcleo Digital e CPC art. 784, §4º.`;

export const contratoParceriaComercialPfPj: PromptCatalogEntry = {
  id: 'contrato-parceria-comercial-pf-pj',
  tipoDocumento: 'CONTRATO_PARCERIA_COMERCIAL',
  tipoRelacao: 'PF_PJ',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_nome',
    'credor_cpf',
    'devedor_razao_social',
    'devedor_cnpj',
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
    'Rescisão',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
