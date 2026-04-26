/**
 * Contract test: valida que a rota /api/vision/extract-from-image deste serviço
 * está em conformidade com docs/contracts/ia-vision-extracao.yaml.
 *
 * O Zod schema em src/schemas/vision.ts também deve espelhar o YAML —
 * este teste valida ambos simultaneamente.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  VisionExtractResponseDadosSchema,
  CampoExtraidoSchema,
  ParteExtraidaSchema,
} from '../../src/schemas/vision';

type OpenApiSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  enum?: unknown[];
};

type OpenApiDoc = {
  openapi: string;
  info: { version: string; title: string };
  paths: Record<string, Record<string, { operationId: string }>>;
  components: { schemas: Record<string, OpenApiSchema> };
};

describe('Contract: /api/vision/extract-from-image', () => {
  const contractPath = path.resolve(__dirname, '../../../docs/contracts/ia-vision-extracao.yaml');
  let doc: OpenApiDoc;

  beforeAll(() => {
    expect(fs.existsSync(contractPath)).toBe(true);
    const raw = fs.readFileSync(contractPath, 'utf-8');
    doc = yaml.load(raw) as OpenApiDoc;
  });

  it('YAML expõe POST /api/vision/extract-from-image com operationId extrairCamposContrato', () => {
    const item = doc.paths['/api/vision/extract-from-image'];
    expect(item).toBeDefined();
    expect(item.post).toBeDefined();
    expect(item.post.operationId).toBe('extrairCamposContrato');
  });

  it('Schema CampoExtraido exige valor + confianca', () => {
    const schema = doc.components.schemas.CampoExtraido;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(expect.arrayContaining(['valor', 'confianca']));
  });

  it('Schema ParteExtraida exige papel + nome', () => {
    const schema = doc.components.schemas.ParteExtraida;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(expect.arrayContaining(['papel', 'nome']));
  });

  it('Schema VisionExtractResponseDados tem campos alinhados ao BillEasy', () => {
    const schema = doc.components.schemas.VisionExtractResponseDados;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(
      expect.arrayContaining(['confiancaGeral', 'paginasProcessadas', 'campos', 'partes']),
    );

    const camposSchema = schema.properties?.campos;
    expect(camposSchema).toBeDefined();
    expect(Object.keys(camposSchema!.properties!)).toEqual(
      expect.arrayContaining([
        'descricaoUsuario',
        'valor',
        'quantidadeParcelas',
        'metodoPagamento',
        'primeiroVencimento',
      ]),
    );
  });

  it('Implementação real do router existe', async () => {
    const routerModule = await import('../../src/routes/vision-documents.js');
    expect(routerModule.default).toBeDefined();
  });

  it('Router usa field "file" no multipart (bate com YAML)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/routes/vision-documents.ts'),
      'utf-8',
    );
    expect(source).toMatch(/upload\.single\(['"]file['"]\)/);

    const requestSchema = doc.components.schemas.VisionExtractRequest;
    expect(requestSchema.required).toContain('file');
  });

  it('Zod schema CampoExtraido aceita objeto válido e rejeita inválido', () => {
    expect(CampoExtraidoSchema.safeParse({ valor: 'x', confianca: 0.8 }).success).toBe(true);
    expect(CampoExtraidoSchema.safeParse({ valor: 'x', confianca: 1.5 }).success).toBe(false);
    expect(CampoExtraidoSchema.safeParse({ valor: 'x' }).success).toBe(false);
  });

  it('Zod schema ParteExtraida exige papel + nome', () => {
    const valida = ParteExtraidaSchema.safeParse({
      papel: { valor: 'CREDOR', confianca: 0.9 },
      nome: { valor: 'João', confianca: 0.95 },
    });
    expect(valida.success).toBe(true);

    const invalida = ParteExtraidaSchema.safeParse({
      nome: { valor: 'João', confianca: 0.95 },
    });
    expect(invalida.success).toBe(false);
  });

  it('Zod schema VisionExtractResponseDados aceita resposta canônica', () => {
    const canonica = {
      confiancaGeral: 0.85,
      paginasProcessadas: 1,
      campos: {
        valor: { valor: '10000.00', confianca: 0.95 },
        quantidadeParcelas: { valor: '3', confianca: 0.9 },
        metodoPagamento: { valor: 'PIX', confianca: 0.8 },
      },
      partes: [
        {
          papel: { valor: 'CREDOR', confianca: 0.95 },
          nome: { valor: 'João', confianca: 0.98 },
        },
      ],
    };
    expect(VisionExtractResponseDadosSchema.safeParse(canonica).success).toBe(true);
  });
});
