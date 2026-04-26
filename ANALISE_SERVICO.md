# Analise Completa - BillEasy AI Service

**Data da analise:** 07/04/2026
**Versao do servico:** 1.0.0
**Stack:** Node.js + Express + TypeScript

---

## Indice

1. [Visao Geral e Arquitetura](#1-visao-geral-e-arquitetura)
2. [Estrutura de Diretorios](#2-estrutura-de-diretorios)
3. [Metodos de Analise de Arquivos](#3-metodos-de-analise-de-arquivos)
4. [Pipeline de Extracao de Dados](#4-pipeline-de-extracao-de-dados)
5. [Sistema de Confianca](#5-sistema-de-confianca)
6. [Geracao de Documentos](#6-geracao-de-documentos)
7. [Conexao com Backend Java](#7-conexao-com-backend-java)
8. [Mapa Completo de Rotas](#8-mapa-completo-de-rotas)
9. [Seguranca](#9-seguranca)
10. [Analise Critica e Falhas Potenciais](#10-analise-critica-e-falhas-potenciais)
11. [Cobertura de Testes](#11-cobertura-de-testes)
12. [Recomendacoes](#12-recomendacoes)

---

## 1. Visao Geral e Arquitetura

O `billeasy-ai-service` e um microservico Node.js/TypeScript que atua como **camada de inteligencia artificial** da plataforma BillEasy. Ele nao e acessado diretamente pelo frontend -- opera como servico intermediario entre o backend Java e APIs de IA externas.

### Funcionalidades Principais

| Funcionalidade | Tecnologia | Arquivo |
|---|---|---|
| Transcricao de audio | OpenAI Whisper (`whisper-1`) | `src/services/whisper.ts` |
| OCR de imagens | Tesseract.js (portugues) | `src/services/tesseract.ts` |
| Extracao de dividas de texto | Claude Sonnet 4 | `src/services/claude.ts` |
| Classificacao de documentos | Claude Sonnet 4 | `src/services/document-classifier.ts` |
| Geracao de documentos juridicos | Claude Sonnet 4 | `src/services/document-generator.ts` |
| Persistencia de dados extraidos | API HTTP para Java backend | `src/services/billeasy-api.ts` |

### Diagrama de Arquitetura

```
                    +-------------------+
                    |  Backend Java     |
                    |  (Spring Boot)    |
                    +--------+----------+
                             |
                    X-Service-Token
                             |
                    +--------v----------+
                    |  billeasy-ai-     |
                    |  service (Node)   |
                    +---+---+---+-------+
                        |   |   |
           +------------+   |   +------------+
           |                |                |
    +------v------+  +------v------+  +------v------+
    | OpenAI      |  | Anthropic   |  | PostgreSQL  |
    | Whisper API |  | Claude API  |  | (Prisma RO) |
    +-------------+  +-------------+  +-------------+
```

### Dependencias Principais

| Pacote | Versao | Uso |
|---|---|---|
| `@anthropic-ai/sdk` | 0.32.1 | Claude AI (extracao, classificacao, geracao) |
| `openai` | 4.77.3 | Whisper (transcricao de audio) |
| `tesseract.js` | 5.1.1 | OCR (extracao de texto de imagens) |
| `@prisma/client` | 5.22.0 | ORM PostgreSQL (somente leitura) |
| `express` | 4.21.2 | Framework HTTP |
| `zod` | 3.24.1 | Validacao de schemas |
| `multer` | 1.4.5 | Upload de arquivos |
| `winston` | 3.17.0 | Logging estruturado |
| `ioredis` | 5.4.2 | Redis (declarado, **nao utilizado**) |

---

## 2. Estrutura de Diretorios

```
src/
+-- server.ts                          # Entry point, middlewares globais, startup
+-- config/
|   +-- index.ts                       # Validacao de env vars com Zod
|   +-- database.ts                    # Singleton Prisma Client
+-- middleware/
|   +-- auth.ts                        # Autenticacao service-to-service
|   +-- error-handler.ts              # Error handler global + classe AppError
|   +-- rate-limit.ts                 # Rate limiters (default, heavy, batch)
|   +-- index.ts                      # Re-exportacoes
+-- routes/
|   +-- index.ts                      # Router principal (combina sub-rotas)
|   +-- audio.ts                      # /api/audio/* (transcricao)
|   +-- ocr.ts                        # /api/ocr/* (OCR de imagens)
|   +-- extract.ts                    # /api/extract/* (extracao de dividas)
|   +-- documents.ts                  # /api/documents/* (classificacao/geracao)
+-- services/
|   +-- claude.ts                     # Claude AI - extracao de dividas
|   +-- whisper.ts                    # OpenAI Whisper - transcricao
|   +-- tesseract.ts                  # Tesseract.js - OCR
|   +-- billeasy-api.ts              # Cliente HTTP para backend Java
|   +-- document-classifier.ts       # Classificacao de documentos via Claude
|   +-- document-generator.ts        # Geracao de documentos via Claude
|   +-- job-store.ts                  # Store in-memory para jobs assincronos
|   +-- prompt-resolver.ts           # Resolucao de prompts do catalogo
+-- prompts/
|   +-- debt-extraction.ts           # Prompt de extracao multi-divida
|   +-- classification/              # Prompts de classificacao
|   |   +-- classify-extract.prompt.ts
|   |   +-- schema.ts                # Schema Zod do output
|   +-- documents/                   # 15 templates de documentos (5 tipos x 3 relacoes)
|   +-- catalog/                     # Sistema de catalogo de prompts
|       +-- index.ts                 # Registry
|       +-- types.ts                 # Tipos
|       +-- fill-variables.ts        # Substituicao segura de variaveis
|       +-- validate-extracted-data.ts # Validacao de dados extraidos
+-- types/
|   +-- index.ts                     # Tipos TypeScript globais
+-- utils/
    +-- logger.ts                    # Configuracao Winston
```

---

## 3. Metodos de Analise de Arquivos

### 3.1 OCR - Extracao de Texto de Imagens

**Arquivo:** `src/services/tesseract.ts`
**Tecnologia:** Tesseract.js v5.1.1
**Idioma:** Portugues (`por`)

#### Como Funciona

1. Um **worker singleton** do Tesseract e inicializado na primeira chamada e reutilizado (`tesseract.ts:10-25`)
2. A imagem e processada pelo engine de reconhecimento optico
3. O resultado contem texto extraido, confianca normalizada (0-1), palavras com bounding boxes e linhas

#### O Que Extrai

| Metodo | Retorno | Descricao |
|---|---|---|
| `extractTextFromImage(path)` | `OCRResult` | Texto bruto + confianca + palavras + linhas com bboxes |
| `extractTextFromBuffer(buffer)` | `OCRResult` | Mesmo acima, a partir de buffer em memoria |
| `preprocessAndExtract(path)` | `OCRResult` | OCR com configuracoes extras (`PSM.AUTO`, `preserve_interword_spaces`) |
| `extractDocumentFields(path)` | Campos estruturados | Regex sobre texto OCR para valores, datas, CPF/CNPJ, nomes |

#### Extracao de Campos via Regex (`tesseract.ts:167-217`)

Apos o OCR, o servico aplica regex para extrair campos financeiros:

```
Valores:   R$\s*[\d.,]+|\d+[.,]\d{2}\s*(?:reais|mil)
Datas:     \d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}|\d{2}\s+de\s+\w+\s+de\s+\d{4}
CPF/CNPJ:  \d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}
Nomes:     (?:Sr\.?|Sra\.?|Dr\.?|Dra\.?)\s*[A-Z...][a-z...]...
```

#### Limitacoes Criticas do OCR

- **Sem pre-processamento real de imagem**: O metodo `preprocessAndExtract` aceita opcoes `threshold` e `deskew` mas **nao as implementa** -- apenas configura parametros do Tesseract (`tesseract.ts:114-164`). Nao ha binarizacao, rotacao ou limpeza de ruido
- **Worker unico**: Um unico worker para todas as requisicoes. Sob carga, requisicoes ficam enfileiradas sequencialmente
- **Regex limitado para nomes**: So captura nomes precedidos de "Sr.", "Sra.", "Dr.", "Dra." -- nomes sem titulo sao ignorados
- **Sem validacao de CPF/CNPJ**: O regex captura o formato mas nao valida o digito verificador
- **PDF via Tesseract**: PDFs sao processados como imagem, sem extratores de texto nativo (pdftotext, etc.)

### 3.2 Transcricao de Audio

**Arquivo:** `src/services/whisper.ts`
**Tecnologia:** OpenAI Whisper API (`whisper-1`)
**Idioma padrao:** Portugues (`pt`)

#### Como Funciona

1. O arquivo de audio e enviado como stream para a API do OpenAI (`whisper.ts:43-49`)
2. A API retorna o texto transcrito
3. O servico retorna confianca fixa de `0.95` (Whisper nao fornece score por utterance)

#### Configuracoes de Rede

- **TCP keepalive**: Probe a cada 5 segundos para evitar reset de NAT no Railway (`whisper.ts:14-25`)
- **Timeout**: 120 segundos
- **Max retries**: 1

#### Fluxo Assincrono

A transcricao usa o **Job Store** (`job-store.ts`) para processamento background:

```
POST /api/audio/transcribe
  -> Retorna 202 + jobId imediatamente
  -> Processa em background
  -> Cliente faz polling em GET /api/audio/job/:jobId
```

#### Limitacoes Criticas do Audio

- **Confianca fixa (0.95)**: Nao reflete a qualidade real da transcricao (`whisper.ts:56`)
- **Sem validacao de duracao real**: Valida apenas tamanho do arquivo (MB), nao a duracao em segundos
- **Sem retry**: Se a API do Whisper falhar, o job falha permanentemente
- **Formato `json` simples**: Usa `response_format: 'json'` que retorna apenas texto, sem timestamps ou detalhes por segmento

### 3.3 Extracao de Dividas via Claude AI

**Arquivo:** `src/services/claude.ts`
**Modelo:** `claude-sonnet-4-20250514` (hardcoded)
**Max tokens:** 4096

#### Como Funciona

1. Texto livre e enviado para Claude com o prompt de sistema `MULTI_DEBT_EXTRACTION_PROMPT` (`claude.ts:88-99`)
2. Claude analisa o texto e retorna JSON com array de dividas
3. O servico faz parse do JSON, removendo blocos markdown (`claude.ts:113-116`)
4. Calcula confianca ponderada por campo (`claude.ts:29-73`)

#### Campos Extraidos

| Campo | Peso na Confianca | Tipo |
|---|---|---|
| `nomeDevedor` | 25% | `{ valor: string, confianca: number }` |
| `valorPrincipal` | 25% | `{ valor: string, confianca: number }` |
| `cpfCnpj` | 15% | `{ valor: string, confianca: number }` |
| `descricao` | 15% | `{ valor: string, confianca: number }` |
| `dataVencimento` | 10% | `{ valor: string, confianca: number }` |
| `nomeCredor` | 10% | `{ valor: string, confianca: number }` |
| `email` | - | `{ valor: string, confianca: number }` |
| `telefone` | - | `{ valor: string, confianca: number }` |
| `tipoDebito` | - | Enum de tipos de debito |

#### Tipos de Debito Suportados

```
EMPRESTIMO_PESSOAL, COMPRA_VEICULO, ALUGUEL, SERVICO_PRESTADO,
COMPRA_MERCADORIA, CHEQUE_DEVOLVIDO, NOTA_PROMISSORIA, CARTAO_CREDITO, OUTRO
```

#### Processamento em Batch (`claude.ts:225-255`)

- Processa ate 10 itens por requisicao
- Concorrencia limitada a 3 chamadas simultaneas ao Claude
- Chunks de 3 itens processados sequencialmente

---

## 4. Pipeline de Extracao de Dados

### 4.1 Fluxo: Imagem -> Texto -> Extracao -> Confirmacao

```
[Upload Imagem]
      |
      v
POST /api/ocr/extract-and-analyze
      |
      v
+--Tesseract OCR--+     +--Claude AI--+     +--Validacao--+
| extractText     | --> | extractDebts | --> | validateDebt|
| FromImage()     |     | FromText()   |     |             |
+-----------------+     +-------------+     +------+------+
                                                   |
                                                   v
                                        POST /api/extract/confirm
                                                   |
                              +--------------------+--------------------+
                              |                                         |
                    +---------v---------+                     +---------v---------+
                    | Prisma: busca     |                     | billeasyApi:      |
                    | devedor existente |                     | createDevedor()   |
                    | (READ)            |                     | createDivida()    |
                    +-------------------+                     | (WRITE via Java)  |
                                                              +-------------------+
```

### 4.2 Fluxo: Audio -> Texto -> Extracao

```
[Upload Audio]
      |
      v
POST /api/audio/transcribe-and-extract
      |
      v
   Retorna jobId (202 Accepted)
      |
      v (background)
+--Whisper API--+     +--Claude AI--+
| transcribe    | --> | extractDebts|
| Audio()       |     | FromText()  |
+---------------+     +------+------+
                             |
                             v
                    updateJob(jobId, result)
                             |
                             v
          GET /api/audio/job/:jobId -> resultado
```

### 4.3 Fluxo: Texto Livre -> Extracao Direta

```
[Texto]
   |
   v
POST /api/extract/text
   |
   v
+--Claude AI--+
| extractDebts|
| FromText()  |
+------+------+
       |
       v
{ dividas[], confiancaGeral, observacoes, metricas }
```

### 4.4 Confirmacao e Persistencia (`extract.ts:172-266`)

O endpoint `POST /api/extract/confirm` executa a persistencia em dois passos:

**Passo 1 - Buscar ou criar devedor:**
- **Leitura via Prisma** (`extract.ts:194-202`): Busca devedor existente por nome (case-insensitive, `contains`) na empresa
- Se nao encontrar, **escrita via API Java** (`extract.ts:209-215`): Cria novo devedor

**Passo 2 - Criar divida:**
- **Escrita via API Java** (`extract.ts:229-237`): Cria a divida vinculada ao devedor
- Parse de valor monetario: remove caracteres nao numericos, troca virgula por ponto (`extract.ts:232`)

#### Problemas Criticos no Confirm

- **Busca por `contains` e fragil**: `nome: { contains: "Joao", mode: "insensitive" }` pode retornar "Joao Silva" quando o devedor correto e "Joao Santos". Falso positivo vincula divida ao devedor errado
- **Sem deduplicacao por CPF/CNPJ**: Busca apenas por nome, ignorando CPF/CNPJ como chave de identificacao
- **Sem transacao atomica**: Se a criacao do devedor funciona mas a criacao da divida falha, fica um devedor orfao
- **Parse de valor fragil**: `replace(/[^\d,.-]/g, '').replace(',', '.')` falha em valores como "1.500,00" que vira "1.500.00" (incorreto, deveria ser "1500.00")

---

## 5. Sistema de Confianca

### Niveis de Confianca

| Nivel | Score | Significado |
|---|---|---|
| `ALTA` | 0.85 - 1.00 | Dados completos e validados |
| `MEDIA` | 0.70 - 0.84 | Dados parcialmente completos |
| `BAIXA` | 0.50 - 0.69 | Dados incompletos |
| `MUITO_BAIXA` | 0.00 - 0.49 | Dados insuficientes |

### Calculo (`claude.ts:29-73`)

A confianca geral e uma **media ponderada** dos campos presentes:

```
score = sum(campo.confianca * campo.peso) / sum(campos_presentes.peso)
```

Os campos ausentes sao **excluidos do calculo** (nao penalizam o score). Isso significa que um texto com apenas `nomeDevedor` e `valorPrincipal` ambos com confianca 1.0 tera score geral 1.0 ("ALTA"), mesmo faltando CPF, descricao, data, etc.

### Critica ao Sistema de Confianca

- **Viés para cima**: Campos ausentes nao reduzem a confianca, inflando artificialmente o score
- **Confianca do Whisper e ficticia**: Sempre retorna 0.95, nao baseada em dados reais
- **Confianca do Tesseract por documento**: Retorna media geral, nao por campo individual
- **Sem recomendacao automatica**: Nao ha logica que sugira acao baseada no nivel (ex: "BAIXA" deveria bloquear confirmacao automatica)

---

## 6. Geracao de Documentos

### 6.1 Catalogo de Prompts

O servico possui **15 templates de documentos**, organizados por tipo de documento e tipo de relacao entre as partes:

| Tipo de Documento | PF-PF | PF-PJ | PJ-PJ |
|---|---|---|---|
| Acordo de Parcelamento | X | X | X |
| Confissao de Divida | X | X | X |
| Contrato de Prestacao de Servicos | X | X | X |
| Notificacao Extrajudicial | X | X | X |
| Recibo de Quitacao | X | X | X |

**Localizacao:** `src/prompts/documents/`

### 6.2 Pipeline de Geracao (`document-generator.ts`)

```
[Texto livre do usuario]
        |
        v
1. classifyAndExtract()           <-- Classifica tipo + extrai dados estruturados
        |
        v
2. applyDocumentDefaults()        <-- Injeta valores padrao (multa 2%, PIX, data)
        |
        v
3. validateExtractedData()        <-- Valida campos obrigatorios com aliases
        |
        v
4. resolvePrompt()                <-- Busca template no catalogo
        |
        v
5. fillPromptVariables()          <-- Substitui {{variaveis}} com sanitizacao
        |
        v
6. Claude API (max_tokens: 8192)  <-- Gera documento final
        |
        v
[Documento juridico completo]
```

### 6.3 Defaults Aplicados Automaticamente (`document-generator.ts:143-159`)

| Campo | Valor Padrao |
|---|---|
| `percentual_multa` | 2% |
| `percentual_multa_rescisoria` | 10% |
| `forma_pagamento` | PIX |
| `data_acordo` | Data atual (dd/MM/yyyy) |
| `data_documento` | Data atual (dd/MM/yyyy) |

### 6.4 Validacao de Dados (`validate-extracted-data.ts`)

- Verifica presenca de campos obrigatorios definidos no template
- Suporta **aliases**: `credor_razao_social` <-> `credor_nome`, `devedor_cnpj` <-> `devedor_cpf`
- Rejeita valores null, undefined, string vazia, NaN, numeros negativos

### 6.5 Sanitizacao de Variaveis (`fill-variables.ts`)

Todas as variaveis do usuario passam por sanitizacao antes de serem injetadas no prompt:

| Protecao | Descricao |
|---|---|
| Limite de comprimento | Trunca em 500 caracteres |
| Template injection | Remove padroes `{{...}}` recursivos |
| Prompt injection | Neutraliza `\nHuman:`, `\nAssistant:`, `\nSystem:`, `<\|im_start\|>`, `[INST]`, "ignore all previous instructions" |
| Caracteres de controle | Remove chars nao imprimiveis (0x00-0x1F exceto \\t, \\n, \\r) |

---

## 7. Conexao com Backend Java

### 7.1 Padrao Dual de Acesso a Dados

O servico implementa um padrao deliberado de separacao de leitura/escrita:

| Operacao | Via | Justificativa |
|---|---|---|
| **Leitura** | Prisma (PostgreSQL direto) | Performance, sem overhead HTTP |
| **Escrita** | API HTTP (Java backend) | Audit trail, validacoes de negocio, criptografia |

**Arquivo:** `src/services/billeasy-api.ts`

### 7.2 Endpoints Consumidos do Backend Java

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/devedores` | Criar devedor |
| PUT | `/api/devedores/:id` | Atualizar devedor |
| POST | `/api/dividas` | Criar divida |
| PUT | `/api/dividas/:id` | Atualizar divida |
| PATCH | `/api/dividas/:id/status` | Alterar status da divida |
| POST | `/api/dividas/:id/parcelas` | Criar parcelas |
| PATCH | `/api/parcelas/:id/status` | Alterar status de parcela |
| POST | `/api/contratos` | Criar contrato |
| GET | `/actuator/health` | Health check do backend |

### 7.3 Autenticacao Service-to-Service (`auth.ts`)

- **Header:** `X-Service-Token`
- **Validacao:** Comparacao direta com `config.billeasyApi.serviceToken` (`auth.ts:44`)
- Sem auth: `401` (AUTH_TOKEN_MISSING)
- Token invalido: `403` (AUTH_TOKEN_INVALID)

### 7.4 Modelos do Banco (Prisma - somente leitura)

| Modelo | Descricao | Campos-chave |
|---|---|---|
| `Usuario` | Usuarios (credores) | id, nome, email, status, tipoUsuario |
| `Empresa` | Empresas credoras | id, nome, cnpj, tipo, responsavelId |
| `Devedor` | Devedores | id, nome, cpfCnpjEnc, empresaId, usuarioId |
| `Divida` | Dividas | id, descricao, valorPrincipal, devedorId, empresaId |
| `Parcela` | Parcelas de divida | id, numero, valor, dataVencimento, dividaId |
| `Contrato` | Contratos | id, titulo, valorTotal, credorEmpresaId, devedorId |

**Importante:** As migracoes sao gerenciadas pelo backend Java via Flyway. O Prisma usa `npx prisma db pull` para sincronizar o schema.

---

## 8. Mapa Completo de Rotas

### Rotas Publicas (sem autenticacao)

| Metodo | Rota | Descricao |
|---|---|---|
| GET | `/health` | Status basico do servico |
| GET | `/ready` | Readiness probe (verifica banco) |

### Rotas Protegidas (requer `X-Service-Token`)

#### Audio (`/api/audio`)

| Metodo | Rota | Descricao | Rate Limit |
|---|---|---|---|
| POST | `/api/audio/transcribe` | Transcreve audio (async) | 10 req/min |
| POST | `/api/audio/transcribe-and-extract` | Transcreve + extrai dividas (async) | 10 req/min |
| GET | `/api/audio/job/:jobId` | Consulta status do job | 20 req/min |

#### OCR (`/api/ocr`)

| Metodo | Rota | Descricao | Rate Limit |
|---|---|---|---|
| POST | `/api/ocr/extract` | OCR de imagem | 10 req/min |
| POST | `/api/ocr/extract-fields` | OCR + extracao de campos via regex | 10 req/min |
| POST | `/api/ocr/extract-and-analyze` | OCR + extracao de dividas via Claude | 10 req/min |
| POST | `/api/ocr/extract-file` | OCR a partir de path de arquivo | 10 req/min |

#### Extracao (`/api/extract`)

| Metodo | Rota | Descricao | Rate Limit |
|---|---|---|---|
| POST | `/api/extract/text` | Extrai dividas de texto | 20 req/min |
| POST | `/api/extract/validate` | Valida dados extraidos | 20 req/min |
| POST | `/api/extract/batch` | Batch (max 10 itens) | 5 req/5min |
| POST | `/api/extract/confirm` | Persiste divida no backend Java | 20 req/min |
| GET | `/api/extract/devedores/:empresaId` | Lista devedores da empresa | 20 req/min |

#### Documentos (`/api/documents`)

| Metodo | Rota | Descricao | Rate Limit |
|---|---|---|---|
| POST | `/api/documents/classify` | Classifica texto e extrai dados | 10 req/min |
| POST | `/api/documents/generate` | Classifica + gera documento | 10 req/min |
| GET | `/api/documents/catalog` | Lista prompts disponiveis | 20 req/min |

### Rate Limiting

| Tipo | Janela | Max Requisicoes | Aplicacao |
|---|---|---|---|
| Global (`defaultRateLimiter`) | 60s | 20 | Todas as rotas |
| Heavy Processing (`heavyProcessingLimiter`) | 60s | 10 | Audio, OCR, Documents |
| Batch (`batchLimiter`) | 5min | 5 | /api/extract/batch |
| Health (`healthCheckLimiter`) | 1s | 10 | /health, /ready |

---

## 9. Seguranca

### 9.1 Camadas de Protecao

| Camada | Implementacao | Arquivo |
|---|---|---|
| Headers HTTP | Helmet (CSP desabilitado - API pura) | `server.ts:29-31` |
| CORS | Whitelist de origens em producao | `server.ts:34-49` |
| Autenticacao | Service token via header | `middleware/auth.ts` |
| Rate limiting | express-rate-limit por token/IP | `middleware/rate-limit.ts` |
| Validacao de entrada | Zod + validacoes manuais | Rotas + config |
| Prompt injection | Sanitizacao de variaveis | `catalog/fill-variables.ts` |
| Parse de body | Limite de 50MB | `server.ts:56-57` |
| Trust proxy | `trust proxy 1` para IP real | `server.ts:60` |

### 9.2 Protecao contra Prompt Injection (OWASP LLM01)

O servico implementa protecao em multiplas camadas:

1. **Separacao de dados e instrucoes**: O texto do usuario nunca e usado diretamente como prompt de geracao. Ele e classificado e os dados estruturados sao injetados em templates pre-definidos (`document-generator.ts:1-4`)
2. **Sanitizacao de variaveis**: Todas as variaveis passam por `sanitizeVariableValue()` antes da injecao no template
3. **Validacao de schema**: Output de classificacao validado contra schema Zod

### 9.3 Gaps de Seguranca Identificados

| Severidade | Descricao | Arquivo:Linha |
|---|---|---|
| **MEDIA** | Comparacao de token nao usa `timingSafeEqual` - vulneravel a timing attack | `auth.ts:44` |
| **MEDIA** | `apiKeyAuth` aceita qualquer API key sem validacao real (TODO no codigo) | `auth.ts:93-110` |
| **BAIXA** | CORS aceita todas as origens em desenvolvimento (`true`) | `server.ts:35` |
| **BAIXA** | Service ID hardcoded como `billeasy-backend` - nao identifica qual servico chamou | `auth.ts:60` |
| **INFO** | CSP desabilitado - aceitavel para API pura, mas deve ser documentado | `server.ts:30` |

---

## 10. Analise Critica e Falhas Potenciais

### 10.1 Severidade ALTA

#### Job Store In-Memory (`job-store.ts`)

O store de jobs usa um `Map` em memoria (`job-store.ts:17`). Isso significa:

- **Perda de jobs em restart/crash**: Se o servico reiniciar durante o processamento de um audio, todos os jobs em andamento e resultados sao perdidos
- **Sem escalabilidade horizontal**: Multiplas instancias do servico nao compartilham jobs. O polling do cliente pode bater em uma instancia diferente da que processou o job
- **TTL via setTimeout**: O `setTimeout` de 10 minutos (`job-store.ts:26`) depende do event loop -- em situacoes de backpressure pode nao executar no tempo esperado
- **Redis declarado mas nao usado**: O pacote `ioredis` esta nas dependencias e `REDIS_URL` no .env.example, mas nao e utilizado em lugar algum do codigo

#### Busca de Devedor por Nome (`extract.ts:194-202`)

```typescript
await prisma.devedor.findFirst({
  where: {
    empresaId,
    nome: { contains: extractedDebt.nomeDevedor.valor, mode: 'insensitive' },
  },
});
```

- `findFirst` + `contains` pode retornar o devedor **errado** se houver nomes similares
- Nao usa CPF/CNPJ como criterio de busca, que seria unico
- Pode vincular divida ao devedor errado silenciosamente

#### Parse de Valor Monetario (`extract.ts:231-233`)

```typescript
parseFloat(extractedDebt.valorPrincipal.valor.replace(/[^\d,.-]/g, '').replace(',', '.'))
```

- "R$ 1.500,00" -> "1.500.00" -> `parseFloat("1.500.00")` = **1.5** (errado, deveria ser 1500)
- O primeiro `.` e interpretado como decimal, nao como separador de milhar
- Deveria remover pontos de milhar antes de substituir virgula

### 10.2 Severidade MEDIA

#### Modelo Claude Hardcoded (`claude.ts:90`, `document-classifier.ts:44`, `document-generator.ts:79`)

O modelo `claude-sonnet-4-20250514` esta hardcoded em 3 arquivos diferentes. Problemas:

- Atualizar o modelo requer alterar 3 arquivos
- Nao ha como configurar via variavel de ambiente
- Sem fallback para modelos alternativos em caso de indisponibilidade

#### Sem Retry para APIs Externas

- **Claude**: Nenhum retry automatico em caso de erro 429 (rate limit) ou 500
- **Whisper**: `maxRetries: 1` (`whisper.ts:32`) -- apenas 1 retry
- **Backend Java**: Nenhum retry em `billeasy-api.ts`
- Nao ha circuit breaker para evitar cascata de falhas

#### Sem Validacao de Duracao Real de Audio

O .env.example declara `MAX_AUDIO_DURATION_SECONDS=30` mas nao ha codigo que valide a duracao real do arquivo de audio. A unica validacao e por tamanho de arquivo (MB).

#### Confianca Inflada

O calculo de confianca geral exclui campos ausentes do denominador (`claude.ts:39-72`). Resultado: um texto com apenas 2 campos extraidos com alta confianca reporta score geral "ALTA", quando na realidade os dados sao incompletos.

### 10.3 Severidade BAIXA

#### Pre-processamento de OCR Nao Implementado (`tesseract.ts:114-164`)

O metodo `preprocessAndExtract` aceita opcoes `threshold` e `deskew` mas nao faz nada com elas. Apenas configura `PSM.AUTO` no Tesseract, sem tratamento real da imagem.

#### Worker OCR Singleton

Um unico worker Tesseract processa todas as requisicoes sequencialmente. Sob carga, cria gargalo. Deveria usar pool de workers.

#### Ausencia de Metricas e Observabilidade

- Sem metricas Prometheus/OpenTelemetry
- Sem tracing distribuido (o servico nao propaga trace IDs do backend Java)
- Logs sao a unica forma de observabilidade

#### Graceful Shutdown Incompleto (`server.ts:159-177`)

O shutdown fecha o servidor HTTP e desconecta do Prisma, mas:
- Nao aguarda jobs em processamento no job store
- Nao termina o worker Tesseract (o `beforeExit` em `tesseract.ts:229` pode nao ser chamado em todos os cenarios)
- Nao fecha conexoes do cliente Anthropic/OpenAI

#### Limpeza de Arquivos Temporarios

A rota de audio salva arquivos em `/tmp` via multer disk storage. A limpeza depende do handler da rota -- se o processo crashar entre o upload e o processamento, arquivos orfaos permanecem em disco.

---

## 11. Cobertura de Testes

### Testes Existentes

| Arquivo | Tipo | O Que Testa |
|---|---|---|
| `tests/prompts/classification.test.ts` | Unitario | Validacao do schema Zod de classificacao |
| `tests/prompts/fill-variables.test.ts` | Unitario | Sanitizacao de variaveis (prompt injection) |
| `tests/prompts/validate-extracted-data.test.ts` | Unitario | Validacao de dados extraidos |
| `tests/security/prompt-injection.test.ts` | Seguranca | 10 vetores de ataque de prompt injection |

### O Que NAO Tem Teste

| Area | Impacto |
|---|---|
| Rotas (audio, ocr, extract, documents) | Nenhum teste de integracao |
| Servico Claude (extracao) | Nenhum teste (nem mock) |
| Servico Whisper (transcricao) | Nenhum teste |
| Servico Tesseract (OCR) | Nenhum teste |
| billeasy-api.ts (cliente HTTP) | Nenhum teste |
| Job store | Nenhum teste de comportamento |
| Middleware de auth | Nenhum teste |
| Rate limiting | Nenhum teste |
| Error handler | Nenhum teste |
| Fluxo completo (e2e) | Inexistente |

**Cobertura estimada:** Apenas prompts e sanitizacao estao cobertos. A logica de negocio principal (extracao, classificacao, geracao, persistencia) nao tem nenhum teste automatizado.

---

## 12. Recomendacoes

### Prioridade Alta

1. **Migrar job store para Redis**: O pacote `ioredis` ja esta instalado e `REDIS_URL` ja esta no .env. Implementar `RedisJobStore` para persistencia e escalabilidade horizontal

2. **Corrigir parse de valor monetario**: Substituir a logica em `extract.ts:231-233` por:
   ```typescript
   // Remove tudo exceto digitos e virgula, depois troca virgula por ponto
   const valor = str.replace(/[^\d,]/g, '').replace(',', '.');
   ```

3. **Corrigir busca de devedor**: Priorizar busca por CPF/CNPJ (quando disponivel) antes de fallback para nome. Usar `equals` em vez de `contains`

4. **Adicionar testes de integracao**: Priorizar rotas de extract (confirm) e documents (generate) que sao os fluxos mais criticos

### Prioridade Media

5. **Extrair modelo Claude para configuracao**: Criar `config.anthropic.model` e usar em todos os servicos

6. **Implementar retry com backoff exponencial**: Para chamadas ao Claude, Whisper e backend Java. Considerar biblioteca como `p-retry`

7. **Implementar circuit breaker**: Para APIs externas (Claude, Whisper, backend Java) para evitar cascata de falhas

8. **Usar `timingSafeEqual` para comparacao de token**: Em `auth.ts:44`, trocar `===` por `crypto.timingSafeEqual`

9. **Melhorar calculo de confianca**: Penalizar campos ausentes no score geral, nao apenas ignorar

### Prioridade Baixa

10. **Pool de workers Tesseract**: Substituir worker singleton por pool para melhor throughput

11. **Pre-processamento real de imagens**: Implementar binarizacao, rotacao e limpeza antes do OCR

12. **Implementar `apiKeyAuth` real**: Remover o stub ou implementar validacao contra banco/lista

13. **Adicionar metricas**: Prometheus ou OpenTelemetry para monitoramento de latencia, erros e throughput

14. **Melhorar graceful shutdown**: Aguardar jobs em processamento, terminar workers, fechar conexoes de API

---

## Apendice: Variaveis de Ambiente

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `PORT` | Nao (3001) | Porta do servidor |
| `NODE_ENV` | Nao (development) | Ambiente |
| `DATABASE_URL` | Sim | Conexao PostgreSQL |
| `BILLEASY_API_URL` | Sim | URL do backend Java |
| `BILLEASY_SERVICE_TOKEN` | Sim | Token de autenticacao entre servicos |
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic (Claude) |
| `OPENAI_API_KEY` | Nao | Chave da API OpenAI (Whisper) |
| `REDIS_URL` | Nao | URL do Redis (nao utilizado) |
| `MAX_AUDIO_DURATION_SECONDS` | Nao (180) | Limite de duracao de audio |
| `MAX_FILE_SIZE_MB` | Nao (100) | Limite de tamanho de arquivo |
| `RATE_LIMIT_WINDOW_MS` | Nao (60000) | Janela de rate limiting |
| `RATE_LIMIT_MAX_REQUESTS` | Nao (20) | Max requisicoes por janela |
| `LOG_LEVEL` | Nao (info) | Nivel de log |
| `CORS_ORIGINS` | Nao | Origens adicionais (separadas por virgula) |
