# Changelog - BillEasy AI Service

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-01-26

### Adicionado

- Estrutura inicial do projeto Node.js/Express
- Integração com OpenAI Whisper para transcrição de áudio
- Integração com Claude 3.5 Sonnet para extração de dívidas via NLP
- Integração com Tesseract.js para OCR
- Sistema de confiança com scores por campo
- Cliente HTTP para API BillEasy (Java backend)
- Prisma ORM para leitura do banco PostgreSQL
- Autenticação service-to-service via token
- Rate limiting global e por endpoint
- Logs estruturados com Winston
- Middlewares de error handling
- Endpoints:
  - `/api/audio/transcribe` - Transcrição de áudio
  - `/api/audio/transcribe-and-extract` - Transcrição + extração
  - `/api/ocr/extract` - OCR de imagens
  - `/api/ocr/extract-and-analyze` - OCR + análise
  - `/api/extract/text` - Extração de dívidas de texto
  - `/api/extract/validate` - Validação de dados extraídos
  - `/api/extract/batch` - Processamento em lote
  - `/api/extract/confirm` - Persistência no backend Java
- Documentação completa (README, arquitetura, visão consolidada)
- Configuração TypeScript
- Validação de ambiente com Zod
- Health checks (`/health`, `/ready`)

### Segurança

- Helmet para headers HTTP seguros
- CORS configurado
- Rate limiting para prevenir abuso
- Service-to-service authentication
- Validação de inputs

---

**Convenções de Commits:**

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação de código
- `refactor:` Refatoração de código
- `test:` Adição de testes
- `chore:` Mudanças em build, CI/CD, etc
