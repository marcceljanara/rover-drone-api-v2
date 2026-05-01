FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++
RUN npm ci --omit=dev

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache libstdc++

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY migrations ./migrations

RUN chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "src/app.js"]
