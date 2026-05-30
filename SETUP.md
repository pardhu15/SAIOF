# SAIOF - System Installation & Setup Manual

Follow this step-by-step setup guide to initialize, configure, and boot all platform layers of the Smart Adaptive Intelligent Optimization Framework (SAIOF).

---

## 🛠️ Step 1: Install Platform Dependencies

Install node packages globally and set up the Python machine learning virtual environment.

```bash
# 1. Install central Express server packages
cd server
npm install

# 2. Install React/Vite client packages
cd ../client
npm install

# 3. Configure Python virtual environment & requirements for ML Engine
cd ../ml-engine
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

---

## 🔑 Step 2: Configure Environment Profiles

Create a `.env` file inside the `server/` directory and configure the environment settings:

```bash
cd ../server
cp .env.example .env
```

Ensure the settings are populated correctly:
```env
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_pass>@cluster0.qguncp8.mongodb.net/saiof?retryWrites=true&w=majority
JWT_SECRET=super_secret_saiof_token_key_development_only_9988
NODE_ENV=development
```

---

## 🚀 Step 3: Run the Services

Open separate terminal windows to launch all three core service stacks:

### Terminal A: Express MERN Backend Server
```bash
cd server
npm run dev
```
*Bootstraps the backend engine at http://localhost:5000. Features automatic failover and database retry loops if MongoDB Atlas is unavailable.*

### Terminal B: React Frontend Storefront & Analytics Console
```bash
cd client
npm run dev
```
*Launches the Vite client hot-reload storefront at http://localhost:5173.*

### Terminal C: Python ML Forecasting Microservice
```bash
cd ml-engine
# Activate venv:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Train the forecasting models (seeds Random Forest weights):
python trainTrafficModel.py
python trainCacheModel.py
python trainLatencyModel.py

# Launch the FastAPI server:
uvicorn api.main:app --port 8000
```
*FastAPI microservice binds and runs at http://localhost:8000/docs (Interactive Swagger documentation).*

---

## ⏱️ Step 4: Run the Telemetry Testing Suite & Simulator

Once the platform is running, stressful workloads can be generated in three ways:

### Method A: Live Dashboard Simulation (Recommended)
Log in to the **SAIOF Analytics & Optimization Console** as an admin (`admin@saiof.com` / `Admin@123`), navigate to the **Simulation Console & Telemetry Hub** card at the top, select a workload (`1000`, `3000`, or `5000` requests), and click **Run Workload**. Results will poll and visualize dynamically.

### Method B: CLI Workload Simulator
```bash
# Seed local database with catalog browsing and checkouts (e.g., 3000 requests)
cd testing/simulator
node trafficSimulator.js --requests=3000
```

### Method C: Programmatic Artillery Load Tests
```bash
# Run high-throughput stress testing (requires backend & frontend running)
cd testing
node runLoadTest.js
```
