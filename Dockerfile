FROM node:20-alpine AS builder

WORKDIR /app
COPY . ./

RUN npm ci
RUN npx nx run goaltime-websocket-server:build:production

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist/apps/websocket-server ./
COPY package*.json ./

RUN npm ci --production

ENV NODE_ENV=production
EXPOSE 8888

CMD ["npx", "nx", "run", "goaltime-websocket-server:start"]