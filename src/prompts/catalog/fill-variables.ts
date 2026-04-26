/**
 * Preenche variáveis {{nome}} em um template com valores fornecidos.
 * Usado para injetar dados extraídos no prompt de geração.
 *
 * Segurança: cada valor é sanitizado antes da substituição para evitar
 * prompt injection (OWASP LLM01) e template injection ({{...}} recursivo).
 */

/** Comprimento máximo de cada variável substituída no prompt. */
const MAX_VAR_LENGTH = 500;

/**
 * Sanitiza um valor de variável antes de injetá-lo em um prompt.
 *
 * Proteções aplicadas (em ordem):
 * 1. Limite de comprimento — trunca em MAX_VAR_LENGTH caracteres.
 * 2. Template injection — remove padrões {{...}} para evitar expansão recursiva.
 * 3. Prompt injection markers — neutraliza padrões de role switching usados
 *    em ataques de injeção contra LLMs (ex.: "\n\nHuman:", "<|im_start|>system").
 * 4. Caracteres de controle — remove chars não imprimíveis (exceto \t, \n, \r normais).
 */
export function sanitizeVariableValue(value: string): string {
  // 1. Limite de comprimento
  let safe = value.length > MAX_VAR_LENGTH ? value.slice(0, MAX_VAR_LENGTH) : value;

  // 2. Template injection — remove {{ ... }} para evitar expansão recursiva de variáveis
  safe = safe.replace(/\{\{[^}]*\}\}/g, '');

  // 3. Prompt injection markers — padrões que tentam assumir controle do contexto do LLM
  //    Cobre: Anthropic Claude, OpenAI ChatML, tokens de sistema comuns
  safe = safe
    .replace(/\n{1,}\s*(human|assistant|system|user)\s*:/gi, ' ')
    .replace(/<\|im_(start|end)\|>/gi, '')
    .replace(/<\|(system|user|assistant)\|>/gi, '')
    .replace(/\[INST\]|\[\/INST\]/gi, '')
    .replace(/###\s*(instruction|input|response|system)\s*:/gi, '')
    .replace(/\bignore\s+(all\s+)?(previous|above|prior)\s+instructions?\b/gi, '[REDACTED]');

  // 4. Caracteres de controle não imprimíveis (mantém \t, \n, \r)
  // eslint-disable-next-line no-control-regex
  safe = safe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return safe;
}

export function fillPromptVariables(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const rawValue = value !== undefined && value !== null ? String(value) : '';
    const safeValue = typeof value === 'number' ? rawValue : sanitizeVariableValue(rawValue);
    result = result.split(placeholder).join(safeValue);
  }
  return result;
}
