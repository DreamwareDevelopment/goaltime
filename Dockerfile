FROM node:20-alpine AS builder

# Install OpenSSL and other required packages
RUN apk add --no-cache openssl

WORKDIR /app
COPY . ./

RUN npm ci --production
RUN npx nx run goaltime-websocket-server:build:production

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist/apps/websocket-server ./
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 8888

CMD ["node", "main.js"]
