/**
 * Contract test: valida que as rotas /api/audio/* deste serviço estão em
 * conformidade com docs/contracts/ia-transcricao-audio.yaml.
 *
 * Se este teste quebrar, ou as rotas foram alteradas sem atualizar o YAML, ou o
 * YAML foi alterado sem sincronizar este serviço (e o Java backend).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

type OpenApiSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  enum?: unknown[];
  nullable?: boolean;
};

type OpenApiDoc = {
  openapi: string;
  info: { version: string; title: string };
  paths: Record<
    string,
    Record<string, { operationId: string; requestBody?: unknown; responses: unknown }>
  >;
  components: { schemas: Record<string, OpenApiSchema> };
};

describe('Contract: /api/audio/*', () => {
  const contractPath = path.resolve(__dirname, '../../../docs/contracts/ia-transcricao-audio.yaml');
  let doc: OpenApiDoc;

  beforeAll(() => {
    expect(fs.existsSync(contractPath)).toBe(true);
    const raw = fs.readFileSync(contractPath, 'utf-8');
    doc = yaml.load(raw) as OpenApiDoc;
  });

  it('YAML expõe POST /api/audio/transcribe com operationId iniciarTranscricao', () => {
    const item = doc.paths['/api/audio/transcribe'];
    expect(item).toBeDefined();
    expect(item.post).toBeDefined();
    expect(item.post.operationId).toBe('iniciarTranscricao');
  });

  it('YAML expõe GET /api/audio/job/{jobId} com operationId consultarTranscricao', () => {
    const item = doc.paths['/api/audio/job/{jobId}'];
    expect(item).toBeDefined();
    expect(item.get).toBeDefined();
    expect(item.get.operationId).toBe('consultarTranscricao');
  });

  it('Schema AudioJobIniciadoResponse exige sucesso e dados', () => {
    const schema = doc.components.schemas.AudioJobIniciadoResponse;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(expect.arrayContaining(['sucesso', 'dados']));
    const dados = schema.properties?.dados;
    expect(dados?.required).toEqual(expect.arrayContaining(['jobId', 'status']));
  });

  it('Schema AudioJobStatusDados tem jobId + status + campos opcionais', () => {
    const schema = doc.components.schemas.AudioJobStatusDados;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(expect.arrayContaining(['jobId', 'status']));
    expect(schema.properties?.status?.enum).toEqual(
      expect.arrayContaining(['processing', 'done', 'failed']),
    );
    // texto, confidence, audioDuration, language, metricas são todos opcionais
    expect(schema.properties?.texto).toBeDefined();
    expect(schema.properties?.confidence).toBeDefined();
    expect(schema.properties?.audioDuration).toBeDefined();
    expect(schema.properties?.language).toBeDefined();
    expect(schema.properties?.metricas).toBeDefined();
  });

  it('Implementação real do router de áudio está registrada', async () => {
    const routerModule = await import('../../src/routes/audio.js');
    expect(routerModule.default).toBeDefined();
  });

  it('Implementação real devolve 202 em caso de sucesso (matches schema)', () => {
    // A rota implementada em src/routes/audio.ts devolve res.status(202).json({ sucesso, dados: { jobId, status } })
    // Validamos que o source code usa status 202 exatamente como o YAML exige.
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/routes/audio.ts'),
      'utf-8',
    );
    expect(source).toContain('.status(202)');
    expect(source).toContain('jobId');
    expect(source).toContain("'processing'");
  });

  it('Form field name é "audio" no router e no YAML', () => {
    const requestSchema = doc.components.schemas.AudioTranscribeRequest;
    expect(requestSchema).toBeDefined();
    expect(requestSchema.required).toContain('audio');

    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/routes/audio.ts'),
      'utf-8',
    );
    // O router usa `upload.single('audio')` ou similar — valida que o nome do campo bate com o YAML
    expect(source).toMatch(/single\(['"]audio['"]\)/);
  });
});
