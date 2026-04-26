// ===========================================
// Serviço: Tesseract OCR - Extração de Texto de Imagens
// ===========================================

import Tesseract from 'tesseract.js';
import { logger } from '../utils/logger.js';
import type { OCRResult } from '../types/index.js';

// Cache do worker para melhor performance
let worker: Tesseract.Worker | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (!worker) {
    logger.info('Inicializando worker Tesseract');
    worker = await Tesseract.createWorker('por', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.debug('Tesseract progresso', { progress: Math.round(m.progress * 100) });
        }
      },
    });
    logger.info('Worker Tesseract inicializado');
  }
  return worker;
}

export async function extractTextFromImage(
  imagePath: string
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    logger.info('Iniciando OCR de imagem', { imagePath });

    const tesseractWorker = await getWorker();
    const result = await tesseractWorker.recognize(imagePath);

    const duration = Date.now() - startTime;

    const ocrResult: OCRResult = {
      texto: result.data.text.trim(),
      confidence: result.data.confidence / 100, // Normaliza para 0-1
      palavras: result.data.words.map((word) => ({
        texto: word.text,
        confidence: word.confidence / 100,
        bbox: word.bbox,
      })),
      linhas: result.data.lines.map((line) => ({
        texto: line.text,
        confidence: line.confidence / 100,
        bbox: line.bbox,
      })),
      duration,
    };

    logger.info('OCR concluído', {
      duration: `${duration}ms`,
      textLength: ocrResult.texto.length,
      confidence: `${Math.round(ocrResult.confidence * 100)}%`,
      palavrasDetectadas: ocrResult.palavras.length,
    });

    return ocrResult;
  } catch (error) {
    logger.error('Erro no OCR', { error, imagePath });
    throw error;
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    logger.info('Iniciando OCR de buffer', { filename, bufferSize: buffer.length });

    const tesseractWorker = await getWorker();
    const result = await tesseractWorker.recognize(buffer);

    const duration = Date.now() - startTime;

    const ocrResult: OCRResult = {
      texto: result.data.text.trim(),
      confidence: result.data.confidence / 100,
      palavras: result.data.words.map((word) => ({
        texto: word.text,
        confidence: word.confidence / 100,
        bbox: word.bbox,
      })),
      linhas: result.data.lines.map((line) => ({
        texto: line.text,
        confidence: line.confidence / 100,
        bbox: line.bbox,
      })),
      duration,
    };

    logger.info('OCR de buffer concluído', {
      duration: `${duration}ms`,
      textLength: ocrResult.texto.length,
      confidence: `${Math.round(ocrResult.confidence * 100)}%`,
    });

    return ocrResult;
  } catch (error) {
    logger.error('Erro no OCR de buffer', { error });
    throw error;
  }
}

// Pré-processamento de imagem para melhor OCR
export async function preprocessAndExtract(
  imagePath: string,
  options?: {
    threshold?: boolean;
    deskew?: boolean;
  }
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    logger.info('Iniciando OCR com pré-processamento', { imagePath, options });

    const tesseractWorker = await getWorker();

    // Configura parâmetros para melhor extração
    await tesseractWorker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1',
    });

    const result = await tesseractWorker.recognize(imagePath);

    const duration = Date.now() - startTime;

    const ocrResult: OCRResult = {
      texto: result.data.text.trim(),
      confidence: result.data.confidence / 100,
      palavras: result.data.words.map((word) => ({
        texto: word.text,
        confidence: word.confidence / 100,
        bbox: word.bbox,
      })),
      linhas: result.data.lines.map((line) => ({
        texto: line.text,
        confidence: line.confidence / 100,
        bbox: line.bbox,
      })),
      duration,
    };

    logger.info('OCR com pré-processamento concluído', {
      duration: `${duration}ms`,
      confidence: `${Math.round(ocrResult.confidence * 100)}%`,
    });

    return ocrResult;
  } catch (error) {
    logger.error('Erro no OCR com pré-processamento', { error, imagePath });
    throw error;
  }
}

// Extração de campos específicos de documentos
export async function extractDocumentFields(
  imagePath: string
): Promise<{
  texto: string;
  campos: {
    valores: string[];
    datas: string[];
    cpfCnpj: string[];
    nomes: string[];
  };
  confidence: number;
}> {
  const startTime = Date.now();

  try {
    const ocrResult = await extractTextFromImage(imagePath);

    // Expressões regulares para campos comuns
    const patterns = {
      valores: /R\$\s*[\d.,]+|\d+[.,]\d{2}\s*(?:reais|mil)/gi,
      datas: /\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{2}\s+de\s+\w+\s+de\s+\d{4}/gi,
      cpfCnpj: /\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
      nomes: /(?:Sr\.?|Sra\.?|Dr\.?|Dra\.?)\s*[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ][a-záéíóúãõâêîôûç]+(?:\s+[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ][a-záéíóúãõâêîôûç]+)*/g,
    };

    const campos = {
      valores: ocrResult.texto.match(patterns.valores) || [],
      datas: ocrResult.texto.match(patterns.datas) || [],
      cpfCnpj: ocrResult.texto.match(patterns.cpfCnpj) || [],
      nomes: ocrResult.texto.match(patterns.nomes) || [],
    };

    const duration = Date.now() - startTime;

    logger.info('Extração de campos de documento concluída', {
      duration: `${duration}ms`,
      valoresEncontrados: campos.valores.length,
      datasEncontradas: campos.datas.length,
      cpfCnpjEncontrados: campos.cpfCnpj.length,
    });

    return {
      texto: ocrResult.texto,
      campos,
      confidence: ocrResult.confidence,
    };
  } catch (error) {
    logger.error('Erro na extração de campos de documento', { error, imagePath });
    throw error;
  }
}

// Termina o worker (cleanup)
export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    logger.info('Worker Tesseract terminado');
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await terminateWorker();
});
