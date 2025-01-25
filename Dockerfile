FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY apps/websocket-server ./apps/websocket-server
COPY libs ./libs

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