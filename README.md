# BillEasy AI Service

Microserviço de Inteligência Artificial para o BillEasy - Sistema de Gestão de Cobranças.

## 🎯 Funcionalidades

- **Transcrição de Áudio**: Converte áudio para texto usando OpenAI Whisper
- **OCR**: Extração de texto de imagens e documentos com Tesseract.js
- **Extração de Dívidas**: Análise de texto com Claude para extrair informações estruturadas de dívidas
- **Sistema de Confiança**: Score de confiança para cada campo extraído
- **Integração Híbrida**: Leitura direta do banco (Prisma) + Escrita via API Java (segurança)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│       BillEasy AI Service (Node.js)     │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │ Whisper  │  │  Claude  │  │ OCR  │  │
│  └──────────┘  └──────────┘  └──────┘  │
│                                         │
│  READ (Prisma) ←────→ PostgreSQL       │
│  WRITE (HTTP)  ←────→ BillEasy Java    │
│                                         │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- PostgreSQL (Neon)
- OpenAI API Key
- Anthropic API Key

### Instalação

```bash
# Clone o repositório
git clone https://github.com/BillEasy26/BillEasy_V1.git
cd BillEasy_V1/billeasy-ai-service

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Sincronize o schema do Prisma
npm run prisma:pull
npm run prisma:generate

# Inicie em desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# Servidor
PORT=3001
NODE_ENV=development

# Database (mesma do backend Java - SOMENTE LEITURA)
DATABASE_URL="postgresql://..."

# BillEasy Backend API (Java)
BILLEASY_API_URL="http://localhost:8080"
BILLEASY_SERVICE_TOKEN="token-seguro"

# OpenAI (Whisper)
OPENAI_API_KEY="sk-..."

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."
```

## 📚 API Endpoints

### Health Check

```http
GET /health
GET /ready
```

### Áudio

```http
POST /api/audio/transcribe
POST /api/audio/transcribe-and-extract
```

### OCR

```http
POST /api/ocr/extract
POST /api/ocr/extract-fields
POST /api/ocr/extract-and-analyze
```

### Extração

```http
POST /api/extract/text
POST /api/extract/validate
POST /api/extract/batch
POST /api/extract/confirm
GET  /api/extract/devedores/:empresaId
```

## 🔐 Autenticação

Todas as rotas `/api/*` requerem autenticação via Service Token:

```bash
curl -X POST http://localhost:3001/api/audio/transcribe \
  -H "X-Service-Token: seu-token-seguro" \
  -F "audio=@audio.webm"
```

## 📊 Sistema de Confiança

Cada extração retorna um score de confiança:

- **ALTA** (0.85 - 1.0): Dados completos e validados
- **MEDIA** (0.70 - 0.84): Dados parcialmente completos
- **BAIXA** (0.50 - 0.69): Dados incompletos
- **MUITO_BAIXA** (0.0 - 0.49): Dados insuficientes

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage
```

## 📦 Build

```bash
# Build para produção
npm run build

# Executar build
npm start
```

## 🛠️ Tecnologias

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **ORM**: Prisma (read-only)
- **IA**: OpenAI Whisper, Anthropic Claude, Tesseract.js
- **Validação**: Zod
- **Logs**: Winston
- **Rate Limiting**: express-rate-limit

## 📄 Documentação

- [Arquitetura Completa](../ARQUITETURA-SISTEMA-IA-BILLEASY.md)
- [Visão Consolidada](../VISAO-CONSOLIDADA-IA-BILLEASY.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Propriedade de BillEasy - Todos os direitos reservados.

---

**Versão**: 1.0.0  
**Última atualização**: 26/01/2026
