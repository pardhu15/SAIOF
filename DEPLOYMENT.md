# SAIOF - System Deployment & Operations Manual

This document provides absolute, complete instructions for setting up, building, and running the Smart Adaptive Intelligent Optimization Framework (SAIOF) in local development, containerized staging, and cloud production environments.

---

## 🏗️ 1. Infrastructure Overview

SAIOF consists of three independent application layers and two supporting database services, coordinated through container networks or process brokers:

| Component Service | Technology Stack | Port | Primary Endpoint / Path |
| --- | --- | --- | --- |
| **Vite Frontend Storefront** | React 18, Tailwind, Recharts | `5173` | http://localhost:5173/ |
| **Express API Server** | Node.js, Express, Mongoose | `5000` | http://localhost:5000/api/health |
| **Python ML Engine** | FastAPI, RandomForestRegressor | `8000` | http://localhost:8000/docs |
| **MongoDB Database** | MongoDB Atlas / Local Daemon | `27017` | `mongodb://localhost:27017/saiof` |

---

## 💻 2. Local Process Deployment

To run SAIOF as native processes on your developer machine:

### A. Pre-requisites
- **Node.js** version `18.x` or later.
- **Python** version `3.10.x` or later.
- **MongoDB** daemon running locally on port `27017`, or a MongoDB Atlas cloud cluster.

### B. Setup Commands

```bash
# 1. Clone repository
git clone <repository_url> saiof
cd saiof

# 2. Install dependencies globally
npm install
cd server && npm install
cd ../client && npm install

# 3. Configure Python venv for ML Engine
cd ../ml-engine
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

### C. Configure Server Environment
Create a file named `.env` in the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/saiof
JWT_SECRET=super_secret_saiof_token_key_development_only_9988
NODE_ENV=development
```

### D. Launching Services
Launch each module in a separate command window:
- **Express Backend**: `cd server && npm run dev`
- **Vite Frontend**: `cd client && npm run dev`
- **Python ML Engine**:
  ```bash
  cd ml-engine
  # Train RandomForest models:
  python trainTrafficModel.py
  python trainCacheModel.py
  python trainLatencyModel.py
  # Start microservice:
  uvicorn api.main:app --port 8000
  ```

---

## 🐳 3. Multi-Container Docker Deployment

Containerize and orchestrate the entire platform with a single command. Docker Compose automatically handles building source files, establishing private bridged network namespaces, mounting volume mounts, and setting up dependency boot orders.

### A. Pre-requisites
- **Docker Engine** version `20.10.x` or later.
- **Docker Compose** version `2.x` or later.

### B. Deployment Commands
```bash
# Navigate to the docker folder
cd docker

# Build and start all services in the background
docker compose up --build -d
```

### C. Services Exposed to Host
Once docker compose builds, the services bind and expose the following host endpoints:
- **React Frontend Console**: http://localhost:5173/
- **Express API Endpoint**: http://localhost:5000/api/health
- **Python ML Swagger Documentation**: http://localhost:8000/docs
- **MongoDB Database**: `mongodb://localhost:27017/saiof`

### D. Tear-Down
To shut down containers and free system sockets:
```bash
docker compose down
# To wipe persistent database volumes:
docker compose down -v
```

---

## 🔑 4. MongoDB Atlas Cloud Setup

For staging or production cloud deployments, migrate your database store to MongoDB Atlas:

1. **Create Cluster**: Register on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and spin up a free shared cluster.
2. **Network Security Access**:
   - Navigate to **Network Access** under Security.
   - Click **Add IP Address** and add your deployment server's public IP address (or `0.0.0.0/0` to allow all endpoints during initial staging).
3. **Database User Credentials**:
   - Navigate to **Database Access** under Security.
   - Add a database user with password credentials and assign them `Read and Write to any database` permissions.
4. **Obtain Connection String**:
   - Click **Connect** on the cluster overview.
   - Choose **Drivers** and copy the standard URI.
   - Replace `<username>` and `<password>` inside the URI in your `.env` connection profile.

---

## ⚙️ 5. Production Cloud Deployment (Ecosystem)

Deploying SAIOF to cloud platforms such as AWS EC2, Heroku, or DigitalOcean:

### A. Staged Docker Orchestration (Recommended)
1. Provision a Cloud Virtual Private Server (VPS) instance with Docker Engine installed.
2. Transfer project files to the cloud machine using `git clone`.
3. Create a production `.env` profile in `server/` pointing `MONGO_URI` to your Atlas cloud URI.
4. Execute `docker compose up --build -d` within the `docker/` directory.

### B. Direct Process Hosting
1. **Frontend Hosting**: Deploy Vite React static assets via an optimized cloud CDN or Static hosting provider (AWS S3, Netlify, Vercel) by running `npm run build` and uploading the `/dist` directory.
2. **Backend Server Hosting**: Host the Express server on an application manager like PM2 (Process Manager 2) or AWS Elastic Beanstalk:
   ```bash
   npm install -g pm2
   cd server
   pm2 start server.js --name "saiof-backend"
   ```
3. **ML Service Hosting**: Run the FastAPI engine behind a production WSGI/ASGI server like Gunicorn with Uvicorn worker threads:
   ```bash
   gunicorn ml-engine.api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

---

## 🛠️ 6. Troubleshooting Guidelines

### A. Backend "Database Offline" Log Loop
- **Diagnosis**: Mongoose connection fails to establish due to firewall blocks or incorrect connection strings.
- **Solution**: Check if local MongoDB daemon is running (`mongod` command). If using MongoDB Atlas, check that Network Access Whitelists permit connections from the server's public IP.

### B. Vite Storefront blank page or API Connection Refused
- **Diagnosis**: Frontend cannot resolve API requests on `http://localhost:5000/api`.
- **Solution**: Ensure Node Express backend is booted. If running inside Docker, check container status using `docker ps` and check logs using `docker logs saiof-backend`.

### C. FastAPI forecasting connection times out (502 Bad Gateway)
- **Diagnosis**: Backend server cannot ping the FastAPI port.
- **Solution**: Ensure Python ML FastAPI server is active on port `8000`. Inside Docker compose, check that the environment variable `ML_ENGINE_URL` is correctly configured to container host name `http://saiof-ml-engine:8000`.
