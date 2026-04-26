import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE PARCERIA COMERCIAL entre duas pessoas jurídicas (empresas).

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente dados.
2. Linguagem formal e técnica, adequada a contrato empresarial.
3. Valores em Real (R$) ou percentuais.
4. Datas no formato dd/mm/aaaa.
5. CNPJ no formato XX.XXX.XXX/XXXX-XX.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA PARCERIA COMERCIAL EMPRESARIAL

- Divisão de receitas/resultados: modelo de split definido
- Exclusividade: territorial ou de produto/serviço
- Não concorrência: período e amplitude
- Obrigações de cada empresa parceira
- Gestão, relatórios e prestação de contas
- Propriedade intelectual e dados gerados
- Rescisão e direitos pós-encerramento

## VARIÁVEIS FORNECIDAS

Empresa A: {{credor_razao_social}} — CNPJ: {{credor_cnpj}}
Empresa B: {{devedor_razao_social}} — CNPJ: {{devedor_cnpj}}
Objeto da parceria: {{descricao_parceria}}
Divisão de receitas: {{divisao_receitas}}
Exclusividade: {{exclusividade}}
Prazo de vigência: {{prazo_vigencia}}
Data do contrato: {{data_documento}}
Multa rescisória: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do domicílio da Empresa A.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, configurar sociedade de fato irregular.
Obrigatório: Núcleo Digital e CPC art. 784, §4º.`;

export const contratoParceriaComercialPjPj: PromptCatalogEntry = {
  id: 'contrato-parceria-comercial-pj-pj',
  tipoDocumento: 'CONTRATO_PARCERIA_COMERCIAL',
  tipoRelacao: 'PJ_PJ',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_razao_social',
    'credor_cnpj',
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
    'Obrigações das empresas',
    'Exclusividade',
    'Não concorrência',
    'Propriedade intelectual',
    'Prestação de contas',
    'Rescisão',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
