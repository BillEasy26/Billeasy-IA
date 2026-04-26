/**
 * Contract test: valida que a rota /api/documents/generate deste serviço
 * está em conformidade com docs/contracts/ia-gerador-descricao.yaml.
 *
 * Se este teste quebrar, ou a rota foi alterada sem atualizar o YAML, ou o YAML
 * foi alterado sem sincronizar este serviço (e o Java backend).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

type OpenApiSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
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

describe('Contract: /api/documents/generate', () => {
  const contractPath = path.resolve(__dirname, '../../../docs/contracts/ia-gerador-descricao.yaml');
  let doc: OpenApiDoc;

  beforeAll(() => {
    expect(fs.existsSync(contractPath)).toBe(true);
    const raw = fs.readFileSync(contractPath, 'utf-8');
    doc = yaml.load(raw) as OpenApiDoc;
  });

  it('YAML expõe POST /api/documents/generate com operationId gerarDocumento', () => {
    const pathItem = doc.paths['/api/documents/generate'];
    expect(pathItem).toBeDefined();
    expect(pathItem.post).toBeDefined();
    expect(pathItem.post.operationId).toBe('gerarDocumento');
  });

  it('Schema GerarRequest exige campo "texto" string com minLength 10', () => {
    const schema = doc.components.schemas.GerarRequest;
    expect(schema).toBeDefined();
    expect(schema.required).toContain('texto');
    expect(schema.properties?.texto?.type).toBe('string');
    expect(schema.properties?.texto?.minLength).toBe(10);
  });

  it('Schema GerarResponse exige sucesso, documento, metadata', () => {
    const schema = doc.components.schemas.GerarResponse;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(expect.arrayContaining(['sucesso', 'documento', 'metadata']));
  });

  it('Schema GerarResponseMetadata exige promptId e promptVersion', () => {
    const schema = doc.components.schemas.GerarResponseMetadata;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(expect.arrayContaining(['promptId', 'promptVersion']));
  });

  it('Schema ErrorResponse exige sucesso e erro', () => {
    const schema = doc.components.schemas.ErrorResponse;
    expect(schema).toBeDefined();
    expect(schema.required).toEqual(expect.arrayContaining(['sucesso', 'erro']));
  });

  it('ErrorResponse.codigoErro enumera apenas os códigos conhecidos pelos clientes', () => {
    const schema = doc.components.schemas.ErrorResponse;
    const codigoErro = schema.properties?.codigoErro;
    expect(codigoErro?.enum).toEqual(
      expect.arrayContaining([
        'CLASSIFICACAO_FALHOU',
        'DADOS_INSUFICIENTES',
        'GERACAO_FALHOU',
        'PROMPT_NAO_ENCONTRADO',
        'TIMEOUT_IA',
        'HINTS_INVALIDOS',
      ]),
    );
  });

  it('Schema GerarRequest expõe hints opcionais tipoDocumentoHint/tipoRelacaoHint/dominioContratoHint', () => {
    const schema = doc.components.schemas.GerarRequest;
    expect(schema.properties?.tipoDocumentoHint).toBeDefined();
    expect(schema.properties?.tipoRelacaoHint).toBeDefined();
    expect(schema.properties?.dominioContratoHint).toBeDefined();
    // Hints NÃO são obrigatórios — só texto é.
    expect(schema.required).not.toContain('tipoDocumentoHint');
    expect(schema.required).not.toContain('tipoRelacaoHint');
    expect(schema.required).not.toContain('dominioContratoHint');
    // Todos os 8 tipos de documento válidos.
    expect(schema.properties?.tipoDocumentoHint?.enum).toEqual(
      expect.arrayContaining([
        'CONFISSAO_DIVIDA',
        'ACORDO_PARCELAMENTO',
        'RECIBO_QUITACAO',
        'NOTIFICACAO_EXTRAJUDICIAL',
        'CONTRATO_PRESTACAO_SERVICOS',
        'CONTRATO_COMPRA_VENDA',
        'CONTRATO_LOCACAO',
        'CONTRATO_PARCERIA_COMERCIAL',
      ]),
    );
    // tipoRelacao inclui PJ_PF (é aceito e normalizado no AI service).
    expect(schema.properties?.tipoRelacaoHint?.enum).toEqual(
      expect.arrayContaining(['PF_PF', 'PF_PJ', 'PJ_PJ', 'PJ_PF']),
    );
  });

  it('Schema GerarRequest expõe campo dados (object opcional, additionalProperties)', () => {
    const schema = doc.components.schemas.GerarRequest;
    expect(schema.properties?.dados).toBeDefined();
    expect(schema.properties?.dados?.type).toBe('object');
    // Não é obrigatório — o caller legado continua funcionando sem `dados`.
    expect(schema.required).not.toContain('dados');
  });

  it('Implementação real do router valida o mesmo minLength do contrato', async () => {
    // Garante que a rota existe e a validação no código (`texto.trim().length < 10`)
    // casa com o `minLength: 10` do schema. Se o minLength mudar no YAML sem mudar o
    // código, este teste falha.
    const routerModule = await import('../../src/routes/documents.js');
    expect(routerModule.default).toBeDefined();

    const schema = doc.components.schemas.GerarRequest;
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../src/routes/documents.ts'),
      'utf-8',
    );
    const minLength = schema.properties?.texto?.minLength ?? -1;
    // A validação no router é `trim().length < 10` — o número literal precisa bater
    expect(source).toContain(`trim().length < ${minLength}`);
  });
});
