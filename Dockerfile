FROM node:24-slim

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

# Install all dependencies
RUN npm ci && \
    npm ci --prefix server && \
    npm ci --prefix client

# Copy source
COPY . .

# Build frontend
RUN npm --prefix client run build

# Start server
CMD ["node", "server/index.js"]
