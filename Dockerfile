# Stage 1: Build Frontend React Client
FROM node:20-alpine AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend Server
FROM node:20-alpine AS server-builder
WORKDIR /server
COPY server/package*.json server/tsconfig.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies for the server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy built server assets
COPY --from=server-builder /server/dist ./dist
COPY server/src/migrations ./dist/migrations

# Copy built frontend assets to client-dist inside the runner
COPY --from=client-builder /client/dist ./client-dist

# Create data directory and ensure non-root permissions
RUN mkdir -p /app/manup && chown -R node:node /app

USER node
VOLUME ["/app/manup"]

EXPOSE 7780
CMD ["node", "dist/index.js"]
