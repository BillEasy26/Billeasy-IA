// ===========================================
// Types para BillEasy AI Service
// ===========================================

// Níveis de confiança
export type ConfidenceLevel = 'ALTA' | 'MEDIA' | 'BAIXA' | 'MUITO_BAIXA';
export type RecommendedAction = 'CRIAR' | 'CONFIRMAR' | 'SOLICITAR_INFO' | 'REJEITAR';

// Tipos de dívida
export type DebtType =
  | 'EMPRESTIMO_PESSOAL'
  | 'COMPRA_VEICULO'
  | 'ALUGUEL'
  | 'SERVICO_PRESTADO'
  | 'COMPRA_MERCADORIA'
  | 'CHEQUE_DEVOLVIDO'
  | 'NOTA_PROMISSORIA'
  | 'CARTAO_CREDITO'
  | 'OUTRO';

// ===========================================
// Tipos para Extração Legado (compatibilidade)
// ===========================================

export interface DebtorExtraction {
  nome: string | null;
  nome_confianca: number;
  cpf_cnpj: string | null;
  cpf_cnpj_confianca: number;
  cpf_cnpj_valido: boolean | null;
  email: string | null;
  telefone: string | null;
}

export interface DebtExtraction {
  valor_principal: number | null;
  valor_confianca: number;
  tipo: DebtType;
  tipo_confianca: number;
  descricao: string;
  data_vencimento: string | null;
  data_vencimento_confianca: number;
}

export interface ExtractionResult {
  devedor: DebtorExtraction;
  divida: DebtExtraction;
  confianca_geral: number;
  nivel_confianca: ConfidenceLevel;
  acao_recomendada: RecommendedAction;
  alertas: string[];
  dados_faltantes: string[];
}

// ===========================================
// Tipos para Transcrição (Whisper)
// ===========================================

export interface TranscriptionResult {
  texto: string;
  confidence: number;
  duration: number;
  language: string;
}

// ===========================================
// Tipos para OCR (Tesseract)
// ===========================================

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  texto: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OCRLine {
  texto: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OCRResult {
  texto: string;
  confidence: number;
  palavras: OCRWord[];
  linhas: OCRLine[];
  duration: number;
}

// ===========================================
// Tipos para Extração de Dívidas (Claude)
// ===========================================

export interface FieldWithConfidence<T> {
  valor: T;
  confianca: number;
}

export interface ExtractedDebt {
  nomeDevedor: FieldWithConfidence<string>;
  cpfCnpj?: FieldWithConfidence<string>;
  email?: FieldWithConfidence<string>;
  telefone?: FieldWithConfidence<string>;
  valorPrincipal: FieldWithConfidence<string>;
  descricao: FieldWithConfidence<string>;
  tipoDebito?: FieldWithConfidence<DebtType>;
  dataVencimento?: FieldWithConfidence<string>;
  nomeCredor?: FieldWithConfidence<string>;
  confiancaGeral?: {
    score: number;
    nivel: ConfidenceLevel;
  };
}

export interface ProcessingMetrics {
  tempoProcessamento: number;
  tokensUsados: number;
  modelo: string;
}

export interface DebtExtractionResult {
  sucesso: boolean;
  dividas: ExtractedDebt[];
  confiancaGeral: {
    score: number;
    nivel: ConfidenceLevel;
  };
  observacoes?: string;
  erro?: string;
  metricas?: ProcessingMetrics;
}
