# NOTE: Docker is not available on the machine where this repo was last worked
# on, so this file is written but NOT yet run/tested end-to-end.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run db:seed && node dist/index.js"]
