// ===========================================
// Serviço: OpenAI Whisper - Transcrição de Áudio
// ===========================================

import OpenAI from 'openai';
import https from 'https';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { TranscriptionResult } from '../types/index.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import os from 'os';

// Agent com TCP keepalive no nível do socket para evitar ECONNRESET no Railway NAT (~30s)
const keepAliveAgent = new https.Agent({ keepAlive: true, timeout: 120_000 });

// Intercepta a criação de sockets para ativar TCP keepalive a nível de OS
const originalCreateConnection = keepAliveAgent.createConnection.bind(keepAliveAgent);
(keepAliveAgent as any).createConnection = function (options: any, callback: any) {
  const socket = originalCreateConnection(options, callback) as any;
  if (socket && typeof socket.setKeepAlive === 'function') {
    socket.setKeepAlive(true, 5_000); // probe TCP keepalive a cada 5 segundos
  }
  return socket;
};

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  httpAgent: keepAliveAgent,
  timeout: 120_000,
  maxRetries: 1,
});

export async function transcribeAudio(
  audioFilePath: string,
  language: string = 'pt'
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    logger.info('Iniciando transcrição de áudio', { audioFilePath, language });

    const audioFile = fs.createReadStream(audioFilePath);

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language,
      response_format: 'json', // mais leve que verbose_json
    });

    const duration = Date.now() - startTime;

    const result: TranscriptionResult = {
      texto: response.text,
      confidence: 0.95,
      duration: 0,
      language,
    };

    logger.info('Transcrição concluída', {
      duration: `${duration}ms`,
      textLength: result.texto.length,
    });

    return result;
  } catch (error) {
    logger.error('Erro na transcrição', { error, audioFilePath });
    throw error;
  }
}

export async function transcribeAudioBuffer(
  buffer: Buffer,
  filename: string,
  language: string = 'pt'
): Promise<TranscriptionResult> {
  const startTime = Date.now();
  const tmpPath = `${os.tmpdir()}/${Date.now()}-${filename}`;

  try {
    logger.info('Iniciando transcrição de buffer', { filename, size: buffer.length, language });

    await fsPromises.writeFile(tmpPath, buffer);

    const audioStream = fs.createReadStream(tmpPath) as unknown as Parameters<typeof openai.audio.transcriptions.create>[0]['file'];

    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language,
      response_format: 'json', // mais leve que verbose_json — reduz tempo de processamento no servidor
    });

    const duration = Date.now() - startTime;

    const result: TranscriptionResult = {
      texto: response.text,
      confidence: 0.95,
      duration: 0,
      language,
    };

    logger.info('Transcrição de buffer concluída', {
      processingTime: `${duration}ms`,
      textLength: result.texto.length,
    });

    return result;
  } catch (error) {
    logger.error('Erro na transcrição de buffer', { error });
    throw error;
  } finally {
    fsPromises.unlink(tmpPath).catch(() => {});
  }
}
