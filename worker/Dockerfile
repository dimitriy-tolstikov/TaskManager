FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY worker ./worker

CMD ["npx", "tsx", "worker/src/index.ts"]
