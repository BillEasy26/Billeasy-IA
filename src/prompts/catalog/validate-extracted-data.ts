/**
 * Valida se os dados extraídos contêm todas as variáveis obrigatórias do prompt.
 * Retorna a lista de variáveis faltantes para que a geração não prossiga com dados incompletos.
 */

/** Mapeamento de aliases: qualquer variante aceita como substituta */
const ALIASES: Record<string, string[]> = {
  credor_razao_social: ['credor_nome'],
  devedor_razao_social: ['devedor_nome'],
  credor_cnpj: ['credor_cpf'],
  devedor_cnpj: ['devedor_cpf'],
  // Aliases reversos: quando o template exige credor_nome mas a IA extraiu credor_razao_social
  credor_nome: ['credor_razao_social'],
  devedor_nome: ['devedor_razao_social'],
  credor_cpf: ['credor_cnpj'],
  devedor_cpf: ['devedor_cnpj'],
};

function getValue(dados: Record<string, unknown>, key: string): unknown {
  const value = dados[key];
  if (value !== undefined && value !== null && value !== '') {
    return value;
  }
  const aliases = ALIASES[key];
  if (aliases) {
    for (const alias of aliases) {
      const aliasValue = dados[alias];
      if (aliasValue !== undefined && aliasValue !== null && aliasValue !== '') {
        return aliasValue;
      }
    }
  }
  return undefined;
}

export interface ValidateExtractedResult {
  valido: boolean;
  dadosFaltantes: string[];
}

/**
 * Valida se todos os campos obrigatórios estão presentes e preenchidos.
 */
export function validateExtractedData(
  dados: Record<string, unknown>,
  variaveisObrigatorias: string[]
): ValidateExtractedResult {
  const dadosFaltantes: string[] = [];

  for (const key of variaveisObrigatorias) {
    const value = getValue(dados, key);
    if (value === undefined || value === null) {
      dadosFaltantes.push(key);
    } else if (typeof value === 'string' && value.trim() === '') {
      dadosFaltantes.push(key);
    } else if (typeof value === 'number' && (Number.isNaN(value) || value < 0)) {
      dadosFaltantes.push(key);
    }
  }

  return {
    valido: dadosFaltantes.length === 0,
    dadosFaltantes,
  };
}

/**
 * Prepara variáveis para preenchimento do prompt, resolvendo aliases.
 * Retorna apenas as chaves solicitadas com valores convertidos para string/number.
 */
export function prepareVariablesForPrompt(
  dados: Record<string, unknown>,
  variaveisObrigatorias: string[]
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const key of variaveisObrigatorias) {
    const value = getValue(dados, key);
    if (value !== undefined && value !== null) {
      if (typeof value === 'number') {
        result[key] = value;
      } else {
        result[key] = String(value);
      }
    }
  }
  return result;
}
