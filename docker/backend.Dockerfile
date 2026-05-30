FROM node:18-alpine

WORKDIR /app

# Copy root dependency manifests and server manifests first
COPY package*.json ./
COPY server/package*.json ./server/

# Install root dependencies and server packages
RUN npm install
RUN cd server && npm install

# Copy shared core modules
COPY analytics-engine/ ./analytics-engine/
COPY middleware-engine/ ./middleware-engine/

# Copy server codebase and root index files
COPY server/ ./server/
COPY package.json ./

# Expose API port
EXPOSE 5000

# Start production server
CMD ["node", "server/server.js"]
