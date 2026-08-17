FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# EXPO_PUBLIC_* is inlined at export time. Set EXPO_PUBLIC_API_URL
# in Railway Variables before the first deploy; change requires rebuild.
ENV NODE_ENV=production
ENV CI=1
RUN npm run build:web

ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080

CMD ["node", "scripts/serve-web.mjs"]
