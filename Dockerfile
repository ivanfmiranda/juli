# ── Build stage ──────────────────────────────────────────────
FROM node:20-bookworm AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build:prod

# ── Runtime stage ────────────────────────────────────────────
FROM node:20-bookworm-slim

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

ENV PORT=4200
EXPOSE 4200

CMD ["node", "server.js"]
