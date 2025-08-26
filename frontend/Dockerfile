# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# install deps
COPY package.json package-lock.json* ./
RUN npm i

# copy configs and sources
COPY .babelrc webpack.config.js ./
COPY public ./public
COPY src ./src

# Build and run in production mode
ENV PORT=3000
# API_BASE is passed in from docker-compose -> used by DefinePlugin
EXPOSE 3000

RUN npm run build
CMD ["npm", "run", "preview"]
