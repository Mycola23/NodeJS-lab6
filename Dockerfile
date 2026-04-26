# Builder
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production
FROM node:24-alpine
WORKDIR /app


COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

USER node


EXPOSE 3000

CMD ["node", "dist/server.js"]