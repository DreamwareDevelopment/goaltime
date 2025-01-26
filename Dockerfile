FROM node:20-alpine AS builder

RUN apk add openssl

WORKDIR /app
COPY . ./

RUN npm ci
RUN npx nx run goaltime-websocket-server:build:production

FROM node:20-alpine

RUN apk add openssl

WORKDIR /app
COPY --from=builder /app/dist/apps/websocket-server ./
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 8888

CMD ["node", "main.js"]
