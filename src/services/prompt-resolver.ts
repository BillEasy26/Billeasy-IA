/**
 * PromptResolver — Resolve prompt do catálogo por tipo e relação.
 * Determinístico: sempre retorna o mesmo prompt para a mesma combinação.
 */

import type {
  PromptCatalogEntry,
  TipoDocumento,
  TipoRelacao,
  DominioContrato,
} from '../prompts/catalog/types.js';
import { promptCatalog } from '../prompts/catalog/index.js';

/**
 * Resolve prompt do catálogo.
 * @throws Error com código PROMPT_NAO_ENCONTRADO se não existir
 */
export function resolvePrompt(
  tipoDocumento: TipoDocumento,
  tipoRelacao: TipoRelacao,
  dominio?: DominioContrato
): PromptCatalogEntry {
  try {
    return promptCatalog.get(tipoDocumento, tipoRelacao, dominio);
  } catch {
    throw new Error('PROMPT_NAO_ENCONTRADO: Não existe prompt para ' + tipoDocumento + ' / ' + tipoRelacao);
  }
}
