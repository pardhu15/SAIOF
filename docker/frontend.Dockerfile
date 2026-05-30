# Stage 1: Build & Development Environment
FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY client/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source files
COPY client/ ./

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server, binding to host interface
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
