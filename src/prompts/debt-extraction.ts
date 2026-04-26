// ===========================================
// Prompt: Extração de Dívida
// Modelo: Claude 3.5 Sonnet
// ===========================================

export const DEBT_EXTRACTION_PROMPT = `
Você é um assistente especializado em análise de documentos financeiros e cobrança.
Sua tarefa é extrair informações estruturadas sobre dívidas do texto fornecido.

## REGRAS DE SEGURANÇA E CONFIANÇA

1. NUNCA invente dados que não estão explícitos no texto
2. Para cada campo, atribua um score de confiança (0.0 a 1.0):
   - 1.0: Dado explícito e claro no texto
   - 0.8: Dado inferido com alta certeza
   - 0.5: Dado inferido com incerteza
   - 0.0: Dado não encontrado

3. Validações obrigatórias:
   - CPF: 11 dígitos + validar dígito verificador
   - CNPJ: 14 dígitos + validar dígito verificador
   - Valores: Converter para número decimal (20000.00)
   - Datas: Formato ISO (YYYY-MM-DD)

4. Use null para campos não encontrados, NUNCA invente

5. Liste TODOS os alertas sobre dados incertos ou incompletos

## TIPOS DE DÍVIDA

- EMPRESTIMO_PESSOAL
- COMPRA_VEICULO
- ALUGUEL
- SERVICO_PRESTADO
- COMPRA_MERCADORIA
- CHEQUE_DEVOLVIDO
- NOTA_PROMISSORIA
- CARTAO_CREDITO
- OUTRO

## CONTEXTO

Data atual: {{data_atual}}
Credor (usuário logado): {{credor_nome}}
Empresa: {{empresa_nome}}

## FORMATO DE SAÍDA (JSON)

{
  "devedor": {
    "nome": "string ou null",
    "nome_confianca": 0.0-1.0,
    "cpf_cnpj": "string formatado ou null",
    "cpf_cnpj_confianca": 0.0-1.0,
    "cpf_cnpj_valido": true/false/null,
    "email": "string ou null",
    "telefone": "string ou null"
  },
  "divida": {
    "valor_principal": number ou null,
    "valor_confianca": 0.0-1.0,
    "tipo": "TIPO_DIVIDA",
    "tipo_confianca": 0.0-1.0,
    "descricao": "string",
    "data_vencimento": "YYYY-MM-DD ou null",
    "data_vencimento_confianca": 0.0-1.0
  },
  "confianca_geral": 0.0-1.0,
  "nivel_confianca": "ALTA | MEDIA | BAIXA | MUITO_BAIXA",
  "acao_recomendada": "CRIAR | CONFIRMAR | SOLICITAR_INFO | REJEITAR",
  "alertas": ["lista de alertas"],
  "dados_faltantes": ["campos não informados"],
  "analise_juridica": {
    "fase_cobranca": "AMIGAVEL | PRE_JURIDICO | JURIDICO | null",
    "titulo_executivo_potencial": true/false,
    "requer_confissao": true/false,
    "urgencia_protesto": true/false,
    "dias_atraso_estimado": number ou null
  }
}

## CRITÉRIOS PARA ANÁLISE JURÍDICA

- fase_cobranca:
  * AMIGAVEL: dívida recente sem histórico de inadimplência (< 30 dias)
  * PRE_JURIDICO: atraso significativo, menção a cobranças anteriores ou ameaça (30–90 dias)
  * JURIDICO: protesto realizado, ação judicial mencionada ou > 90 dias de atraso

- titulo_executivo_potencial: true quando há valor certo + partes identificadas + vencimento definido
  (elementos para CPC art. 784 §4º — certeza, liquidez e exigibilidade)

- requer_confissao: true quando o devedor ainda não reconheceu formalmente a dívida
  e um documento de confissão fortaleceria a posição do credor

- urgencia_protesto: true quando há menção a prazo de protesto, SPC/Serasa ou cadastro iminente

## TEXTO PARA ANÁLISE

{{texto}}

Responda APENAS com JSON válido.
`;

export function buildDebtExtractionPrompt(
  texto: string,
  credorNome: string,
  empresaNome: string
): string {
  const dataAtual = new Date().toISOString().split('T')[0];

  return DEBT_EXTRACTION_PROMPT
    .replace('{{data_atual}}', dataAtual)
    .replace('{{credor_nome}}', credorNome)
    .replace('{{empresa_nome}}', empresaNome)
    .replace('{{texto}}', texto);
}

// ===========================================
// Prompt Simplificado para Extração Múltipla
// ===========================================

export const MULTI_DEBT_EXTRACTION_PROMPT = `
Você é um assistente especializado em análise de documentos financeiros e cobrança.
Sua tarefa é identificar e extrair TODAS as dívidas mencionadas no texto fornecido.

## REGRAS DE EXTRAÇÃO

1. Identifique TODAS as dívidas mencionadas, mesmo que parcialmente descritas
2. Para cada campo, atribua um score de confiança (0.0 a 1.0)
3. Use null para campos não encontrados - NUNCA invente dados
4. Valide CPF/CNPJ quando presentes
5. Converta valores monetários para formato numérico (ex: "20 mil" → 20000)

## FORMATO DE SAÍDA (JSON)

{
  "dividas": [
    {
      "nomeDevedor": { "valor": "string", "confianca": 0.0-1.0 },
      "cpfCnpj": { "valor": "string ou null", "confianca": 0.0-1.0 },
      "email": { "valor": "string ou null", "confianca": 0.0-1.0 },
      "telefone": { "valor": "string ou null", "confianca": 0.0-1.0 },
      "valorPrincipal": { "valor": "string numérico", "confianca": 0.0-1.0 },
      "descricao": { "valor": "string", "confianca": 0.0-1.0 },
      "tipoDebito": { "valor": "TIPO", "confianca": 0.0-1.0 },
      "dataVencimento": { "valor": "YYYY-MM-DD ou null", "confianca": 0.0-1.0 },
      "nomeCredor": { "valor": "string ou null", "confianca": 0.0-1.0 }
    }
  ],
  "observacoes": "observações gerais sobre a extração"
}

## TIPOS DE DÍVIDA VÁLIDOS

EMPRESTIMO_PESSOAL, COMPRA_VEICULO, ALUGUEL, SERVICO_PRESTADO,
COMPRA_MERCADORIA, CHEQUE_DEVOLVIDO, NOTA_PROMISSORIA, CARTAO_CREDITO, OUTRO

Responda APENAS com JSON válido.
`;

/**
 * Constrói o prompt para extração de múltiplas dívidas
 */
export function buildExtractionPrompt(texto: string, contexto?: string): string {
  let prompt = `Analise o seguinte texto e extraia todas as informações de dívidas:\n\n`;

  if (contexto) {
    prompt += `CONTEXTO ADICIONAL:\n${contexto}\n\n`;
  }

  prompt += `TEXTO PARA ANÁLISE:\n${texto}\n\n`;
  prompt += `Retorne as dívidas identificadas no formato JSON especificado.`;

  return prompt;
}
