FROM node:20-alpine

WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npx prisma generate

RUN npm ci --omit=dev

# App sources
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Start the API
CMD ["node", "src/server.js"]
