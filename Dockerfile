FROM node:20-bookworm

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV PORT=4200
EXPOSE 4200

CMD ["sh", "-lc", "npm run build:prod && node server.js"]
