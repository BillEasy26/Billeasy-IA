/**
 * Validador de Qualidade Jurídica de Documentos — BillEasy
 *
 * Verifica se um documento gerado contém as cláusulas obrigatórias do
 * Núcleo Universal Digital, retornando um score de completude (0–100)
 * e a lista de cláusulas ausentes.
 *
 * Não faz chamada de IA — análise puramente textual (rápida, sem custo).
 */

export interface DocumentValidationResult {
  /** Score de completude jurídica: 0–100 */
  score: number;
  /** true quando score >= 70 */
  aprovado: boolean;
  /** Cláusulas obrigatórias ausentes no documento */
  clausulasAusentes: string[];
  /** Cláusulas presentes */
  clausulasPresentes: string[];
}

/**
 * Indicadores textuais para cada cláusula do Núcleo Universal.
 * Cada entrada é [nomeCláusula, [...termos que indicam presença]].
 */
const INDICADORES_NUCLEO: Array<[string, string[]]> = [
  [
    'Capacidade e declarações das partes',
    ['capacidade civil', 'legitimidade jurídica', 'veracidade', 'responsabilidade pelas informações'],
  ],
  [
    'Aceite eletrônico e manifestação de vontade',
    ['aceite eletrônico', 'aceite digital', 'manifestação de vontade', 'assinatura manuscrita'],
  ],
  [
    'Validade jurídica e força executiva (CPC art. 784 §4º)',
    ['art. 784', '784', '§4º', 'título executivo extrajudicial', 'força executiva', 'lei 14.620'],
  ],
  [
    'Registros eletrônicos e força probatória',
    ['registros técnicos', 'logs de acesso', 'endereço ip', 'força probatória', 'rastreabilidade'],
  ],
  [
    'Cobrança e medidas extrajudiciais',
    ['protesto', 'cobrança eletrônica', 'cadastros de inadimplentes', 'medidas extrajudiciais', 'cobrança automatizada'],
  ],
  [
    'Boa-fé objetiva',
    ['boa-fé', 'boa fé objetiva', 'lealdade', 'transparência', 'cooperação recíproca'],
  ],
  [
    'Responsabilidade pelas informações',
    ['responsabilidade pelo conteúdo', 'responsabilidade pelas informações', 'exclusiva responsabilidade'],
  ],
  [
    'Proteção de dados (LGPD)',
    ['lgpd', 'lei geral de proteção', 'lei nº 13.709', 'dados pessoais', 'proteção de dados'],
  ],
  [
    'Conservação contratual',
    ['conservação contratual', 'nulidade', 'invalidade', 'independência das cláusulas', 'cláusulas válidas'],
  ],
  [
    'Foro',
    ['foro', 'comarca', 'juízo competente', 'jurisdição'],
  ],
];

/**
 * Valida a completude jurídica de um documento gerado.
 *
 * @param documento Texto completo do documento gerado
 * @returns Resultado com score, status e cláusulas ausentes/presentes
 */
export function validateDocument(documento: string): DocumentValidationResult {
  const textoNormalizado = documento.toLowerCase();

  const clausulasPresentes: string[] = [];
  const clausulasAusentes: string[] = [];

  for (const [nome, termos] of INDICADORES_NUCLEO) {
    const encontrou = termos.some((termo) => textoNormalizado.includes(termo.toLowerCase()));
    if (encontrou) {
      clausulasPresentes.push(nome);
    } else {
      clausulasAusentes.push(nome);
    }
  }

  const score = Math.round((clausulasPresentes.length / INDICADORES_NUCLEO.length) * 100);
  const aprovado = score >= 70;

  return { score, aprovado, clausulasAusentes, clausulasPresentes };
}
