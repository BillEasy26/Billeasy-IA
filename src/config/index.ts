import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().optional(),

  // BillEasy API
  BILLEASY_API_URL: z.string(),
  BILLEASY_SERVICE_TOKEN: z.string(),

  // OpenAI (opcional - necessário apenas para transcrição de áudio via Whisper)
  OPENAI_API_KEY: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string(),

  // Processing limits
  MAX_AUDIO_DURATION_SECONDS: z.string().default('180'),
  MAX_FILE_SIZE_MB: z.string().default('100'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('20'),

  // Logging
  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',

  database: {
    url: parsed.data.DATABASE_URL,
  },

  redis: {
    url: parsed.data.REDIS_URL,
  },

  billeasyApi: {
    url: parsed.data.BILLEASY_API_URL,
    serviceToken: parsed.data.BILLEASY_SERVICE_TOKEN,
  },

  openai: {
    apiKey: parsed.data.OPENAI_API_KEY ?? '',
  },

  anthropic: {
    apiKey: parsed.data.ANTHROPIC_API_KEY,
  },

  processing: {
    maxAudioDuration: parseInt(parsed.data.MAX_AUDIO_DURATION_SECONDS, 10),
    maxFileSizeMB: parseInt(parsed.data.MAX_FILE_SIZE_MB, 10),
  },

  rateLimit: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  logging: {
    level: parsed.data.LOG_LEVEL,
  },
};

export default config;
