# Wukong web app + keeper. The Solana program is deployed separately
# (npm run setup:devnet from a machine with the Solana CLI).
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npx next build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    WUKONG_DATA_DIR=/data
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["bash", "scripts/start-prod.sh"]
