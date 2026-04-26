import type { PromptCatalogEntry } from '../catalog/types.js';
import {
  NUCLEO_UNIVERSAL_INSTRUCOES,
  NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
  ESTRUTURA_PADRAO_INSTRUCAO,
} from '../catalog/clausulas-digitais.js';

const INSTRUCOES = `Você é um assistente especializado em redação de documentos jurídicos brasileiros.
Sua tarefa é gerar um CONTRATO DE LOCAÇÃO entre duas pessoas jurídicas (empresas).

## REGRAS OBRIGATÓRIAS

1. Use APENAS os dados fornecidos nas variáveis. NUNCA invente dados.
2. Linguagem formal e técnica, adequada a contrato empresarial de locação.
3. Valores em Real (R$), com duas casas decimais.
4. Datas no formato dd/mm/aaaa.
5. CNPJ no formato XX.XXX.XXX/XXXX-XX.
${ESTRUTURA_PADRAO_INSTRUCAO}
## MÓDULOS OBRIGATÓRIOS PARA LOCAÇÃO EMPRESARIAL

- Destinação: uso exclusivo para fins comerciais/empresariais
- Posse e conservação: obrigações de uso e manutenção
- Encargos: IPTU, condomínio, seguros obrigatórios
- Sublocação: vedação salvo autorização expressa
- Benfeitorias: regime das benfeitorias realizadas
- Devolução: condições e prazo de entrega do bem

## VARIÁVEIS FORNECIDAS

Locadora: {{credor_razao_social}} — CNPJ: {{credor_cnpj}}
Locatária: {{devedor_razao_social}} — CNPJ: {{devedor_cnpj}}
Descrição do imóvel/bem: {{descricao_bem}}
Valor do aluguel mensal: R$ {{valor_mensal}}
Prazo da locação: {{prazo_locacao}}
Data de início: {{data_inicio}}
Data do contrato: {{data_documento}}
Encargos da locatária: {{encargos}}
Multa por atraso: {{percentual_multa}}%
${NUCLEO_UNIVERSAL_INSTRUCOES}
Após o Núcleo Digital, inclua a cláusula de FORO: comarca do local do imóvel.

NÃO inclua: espaços para assinatura, linhas de assinatura, TESTEMUNHAS.

Gere o documento completo em texto contínuo, sem placeholders nem comentários.`;

const RESTRICOES = `Proibido: inventar dados, incluir cláusulas que violem a Lei 8.245/91.
Obrigatório: Núcleo Digital e CPC art. 784, §4º.`;

export const contratoLocacaoPjPj: PromptCatalogEntry = {
  id: 'contrato-locacao-pj-pj',
  tipoDocumento: 'CONTRATO_LOCACAO',
  tipoRelacao: 'PJ_PJ',
  dominio: 'IMOVEL',
  version: '1.0.0',
  instrucoes: INSTRUCOES,
  variaveisObrigatorias: [
    'credor_razao_social',
    'credor_cnpj',
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
    'Destinação',
    'Posse e conservação',
    'Encargos',
    'Benfeitorias',
    'Devolução',
    'Inadimplemento',
    ...NUCLEO_UNIVERSAL_CLAUSULAS_MINIMAS,
    'Foro',
  ],
  restricoes: RESTRICOES,
  createdAt: new Date().toISOString(),
};
