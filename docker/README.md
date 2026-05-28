# SAIOF Docker Configurations

This folder contains containerization configurations for local development and production orchestration.

## Intended Layout
1. **Dockerfile.server:** Environment definition for the Express backend.
2. **Dockerfile.client:** Build configuration (typically Multi-stage with Nginx) for the Vite React frontend.
3. **docker-compose.yml:** Orchestration file combining frontend, backend, MongoDB, and Redis caching.
