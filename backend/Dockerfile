FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# 依存関係のインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:20-alpine

WORKDIR /app

# pnpmをインストール
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod && pnpm store prune

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --chown=nodejs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nodejs

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://0.0.0.0:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/index.js"]