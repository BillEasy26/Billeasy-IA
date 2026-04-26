/**
 * Tipos do Catálogo de Prompts
 * Define estruturas para geração controlada de documentos com IA.
 */

/** Tipos de documento suportados */
export type TipoDocumento =
  | 'ACORDO_PARCELAMENTO'
  | 'RECIBO_QUITACAO'
  | 'NOTIFICACAO_EXTRAJUDICIAL'
  | 'CONFISSAO_DIVIDA'
  | 'CONTRATO_PRESTACAO_SERVICOS'
  | 'CONTRATO_COMPRA_VENDA'
  | 'CONTRATO_LOCACAO'
  | 'CONTRATO_PARCERIA_COMERCIAL';

/** Tipos de relação entre partes (PF=Pessoa Física, PJ=Pessoa Jurídica) */
export type TipoRelacao = 'PF_PF' | 'PF_PJ' | 'PJ_PJ';

/** Domínios / gêneros de contrato (tipo de negócio) */
export type DominioContrato =
  | 'IMOVEL'
  | 'VEICULO'
  | 'MERCADORIA'
  | 'SERVICO'
  | 'FINANCEIRO'
  | 'OUTRO';

/** Entrada do catálogo — prompt versionado e controlado */
export interface PromptCatalogEntry {
  id: string;
  tipoDocumento: TipoDocumento;
  tipoRelacao: TipoRelacao;
  /** Domínio do contrato (ex.: IMOVEL, VEICULO, SERVICO). Quando ausente, é genérico. */
  dominio?: DominioContrato;
  version: string;
  instrucoes: string;
  variaveisObrigatorias: string[];
  clausulasMinimas: string[];
  restricoes: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/** Fase de cobrança da dívida */
export type FaseCobranca = 'AMIGAVEL' | 'PRE_JURIDICO' | 'JURIDICO';

/** Resultado da classificação e extração do texto do usuário */
export interface ClassificationResult {
  tipoDocumento: TipoDocumento;
  tipoRelacao: TipoRelacao;
  /** Domínio identificado (ex.: IMOVEL, VEICULO, SERVICO) */
  dominioContrato?: DominioContrato;
  dados: Record<string, unknown>;
  confianca: number;
  dadosFaltantes?: string[];
  /** Fase de cobrança inferida do contexto */
  faseCobranca?: FaseCobranca | null;
  /** Situação se beneficia de confissão formal de dívida */
  requerConfissao?: boolean | null;
  /** Urgência de protesto ou cadastro de inadimplentes iminente */
  urgenciaProtesto?: boolean | null;
  /** Dados suficientes para constituir título executivo extrajudicial */
  tituloExecutivoPotencial?: boolean | null;
}

/** Requisição de geração a partir de texto livre */
export interface GenerationRequest {
  textoEntrada: string;
  contexto?: Record<string, unknown>;
}

/** Resultado da geração de documento */
export interface GenerationResult {
  sucesso: boolean;
  documento?: string;
  promptId?: string;
  promptVersion?: string;
  erro?: string;
  codigoErro?: 'CLASSIFICACAO_FALHOU' | 'DADOS_INSUFICIENTES' | 'GERACAO_FALHOU' | 'PROMPT_NAO_ENCONTRADO' | 'TIMEOUT_IA';
  dadosUtilizados?: Record<string, unknown>;
  dadosFaltantes?: string[];
  /** Score de completude jurídica (0-100). Presente quando scoreJuridico está ativo. */
  scoreJuridico?: number;
  /** Cláusulas obrigatórias ausentes no documento gerado */
  clausulasAusentes?: string[];
}

/** Item do catálogo listado (resumo) */
export interface PromptCatalogItem {
  id: string;
  tipoDocumento: TipoDocumento;
  tipoRelacao: TipoRelacao;
  version: string;
  dominio?: DominioContrato;
}
