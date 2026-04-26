# AI Service BillEasy - build via GitHub Actions, push para GHCR; Railway faz deploy da imagem.

FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL necessário para o Prisma em Alpine (musl libc)
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Imagem de produção
FROM node:20-alpine
WORKDIR /app

# OpenSSL necessário para o Prisma em Alpine (musl libc)
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copia o client Prisma já gerado com binários para linux-musl-openssl-3.0.x
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copia schema para referência em runtime
COPY prisma ./prisma

# Copia build compilado
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/server.js"]
