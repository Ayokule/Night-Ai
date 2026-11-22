FROM node:24-slim

# Install Python and build tools needed for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

# Install all dependencies (includes better-sqlite3 native build)
RUN npm ci && \
    npm ci --prefix server && \
    npm ci --prefix client

# Copy source
COPY . .

# Build frontend
RUN npm --prefix client run build

# Start server
CMD ["node", "server/index.js"]
