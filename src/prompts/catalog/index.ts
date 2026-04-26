/**
 * Registry do Catálogo de Prompts
 * Centraliza acesso aos prompts de geração de documentos.
 */

import type {
  PromptCatalogEntry,
  TipoDocumento,
  TipoRelacao,
  DominioContrato,
} from './types.js';
import { validatePromptEntry } from './schema.validation.js';

type PromptKey = `${TipoDocumento}_${TipoRelacao}_${DominioContrato | 'ANY'}`;

class PromptCatalogRegistry {
  private prompts = new Map<PromptKey, PromptCatalogEntry>();

  /**
   * Obtém prompt por tipo de documento, relação e (opcionalmente) domínio.
   * Se domínio for informado, tenta primeiro o específico e depois o genérico.
   * @throws se não existir nenhum prompt compatível
   */
  get(
    tipoDocumento: TipoDocumento,
    tipoRelacao: TipoRelacao,
    dominio?: DominioContrato
  ): PromptCatalogEntry {
    const specific = dominio
      ? this.prompts.get(this.key(tipoDocumento, tipoRelacao, dominio))
      : undefined;

    if (specific) {
      return specific;
    }

    const generic = this.prompts.get(this.key(tipoDocumento, tipoRelacao, 'ANY'));
    if (!generic) {
      throw new Error(`Prompt não encontrado: ${tipoDocumento} / ${tipoRelacao}`);
    }
    return generic;
  }

  /**
   * Tenta obter prompt; retorna undefined se não existir.
   * Se domínio for informado, tenta primeiro o específico e depois o genérico.
   */
  getOptional(
    tipoDocumento: TipoDocumento,
    tipoRelacao: TipoRelacao,
    dominio?: DominioContrato
  ): PromptCatalogEntry | undefined {
    const specific = dominio
      ? this.prompts.get(this.key(tipoDocumento, tipoRelacao, dominio))
      : undefined;
    if (specific) {
      return specific;
    }
    return this.prompts.get(this.key(tipoDocumento, tipoRelacao, 'ANY'));
  }

  /**
   * Lista todos os prompts registrados (resumo).
   */
  list(): Array<{
    id: string;
    tipoDocumento: TipoDocumento;
    tipoRelacao: TipoRelacao;
    version: string;
    dominio?: DominioContrato;
  }> {
    return Array.from(this.prompts.values()).map((p) => ({
      id: p.id,
      tipoDocumento: p.tipoDocumento,
      tipoRelacao: p.tipoRelacao,
      version: p.version,
      dominio: p.dominio,
    }));
  }

  /**
   * Registra um prompt. Valida antes de adicionar.
   */
  register(entry: PromptCatalogEntry): void {
    validatePromptEntry(entry);
    const key = this.key(entry.tipoDocumento, entry.tipoRelacao, entry.dominio ?? 'ANY');
    this.prompts.set(key, entry);
  }

  /**
   * Valida todos os prompts registrados.
   * @throws se algum for inválido
   */
  validateAll(): void {
    for (const entry of this.prompts.values()) {
      validatePromptEntry(entry);
    }
  }

  private key(
    tipoDocumento: TipoDocumento,
    tipoRelacao: TipoRelacao,
    dominio: DominioContrato | 'ANY'
  ): PromptKey {
    return `${tipoDocumento}_${tipoRelacao}_${dominio}`;
  }
}

export const promptCatalog = new PromptCatalogRegistry();
export type { PromptCatalogEntry, TipoDocumento, TipoRelacao } from './types.js';
export { validatePromptEntry, promptCatalogEntrySchema } from './schema.validation.js';
