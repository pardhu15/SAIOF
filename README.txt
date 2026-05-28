========================================================================
SAIOF - Smart MERN Stack E-Commerce Storefront
========================================================================

SAIOF is a highly structured, modern MERN stack e-commerce storefront foundation. It is built with React, Vite, Tailwind CSS, and Axios on the frontend, and Node.js, Express.js, MongoDB, and Mongoose on the backend, featuring JWT authentication, database-persisted shopping carts, and custom request performance telemetry logger.

------------------------------------------------------------------------
1. Project Directory Structure
------------------------------------------------------------------------

SAIOF/
├── package.json                   # Root orchestrator (npm dev scripts)
├── README.md                      # Complete project documentation guide (Markdown)
├── README.txt                     # Complete project documentation guide (Plain Text)
│
├── client/                        # React Frontend (localhost:5173)
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js       # Centralized Axios setup (auto-attaches JWT)
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Responsive navbar (switches on Auth state)
│   │   │   ├── ProductCard.jsx    # Catalog product cards
│   │   │   ├── SearchBar.jsx      # Live catalog search input
│   │   │   ├── CartItem.jsx       # Quantity selector and delete row buttons
│   │   │   ├── Loader.jsx         # Global loading spinner
│   │   │   ├── ErrorMessage.jsx   # Diagnostic warning panels
│   │   │   └── AppLoader.jsx      # Fullscreen boot app initializer screen
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global JWT session coordinator
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Storefront catalog with pagination, search, sorts
│   │   │   ├── ProductDetails.jsx # Detail product lookup and cart addition
│   │   │   ├── Login.jsx          # User Sign In
│   │   │   ├── Register.jsx       # User Sign Up
│   │   │   ├── Cart.jsx           # Stateful checkout summary page
│   │   │   └── Dashboard.jsx      # E-commerce "My Account" portal
│   │   ├── App.jsx                # Global router (hides navbar on My Account path)
│   │   └── main.jsx               # Bootstrap setup
│   ├── tailwind.config.js         # Tailwind utility scanner
│   ├── postcss.config.js          # PostCSS parsing configurations
│   ├── vite.config.js             # Runs on Port 5173
│   └── package.json
│
├── server/                        # Express Backend (localhost:5000)
│   ├── config/
│   │   └── db.js                  # Database connection module
│   ├── controllers/
│   │   ├── authController.js      # Auth requests handler
│   │   ├── productController.js   # Product requests handler (with 1500ms delay)
│   │   └── cartController.js      # Cart requests handler
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT token guard and Admin verifier
│   │   ├── errorMiddleware.js     # Uncaught errors catcher
│   │   ├── loggerMiddleware.js    # Telemetry request logger (saves to MongoDB)
│   │   └── metricsMiddleware.js   # TrafficMetric concurrent tracker
│   ├── models/
│   │   ├── User.js                # Schema with pre-save Bcrypt hashing
│   │   ├── Product.js             # Catalog schema with Text search indexes
│   │   ├── Cart.js                # Shopping cart schema mapping user to items
│   │   ├── RequestLog.js          # Core analytics request log schema
│   │   ├── CacheMetric.js         # Cache metrics schema
│   │   └── TrafficMetric.js       # Traffic metrics schema
│   ├── routes/
│   │   ├── healthRoute.js         # GET /api/health endpoint
│   │   ├── authRoutes.js          # Auth routes mapping
│   │   ├── productRoutes.js       # Products routes mapping (middleware-chained)
│   │   └── cartRoutes.js          # Cart routes mapping (JWT protected)
│   ├── services/
│   │   ├── authService.js         # Hashing, login, profile queries
│   │   ├── productService.js      # Filtered, paginated catalog queries
│   │   └── cartService.js         # Cart mutations & dynamic price calculations
│   ├── utils/
│   │   ├── helper.js              # Response formatting
│   │   └── seed.js                # Database seeder (23 catalog items)
│   ├── .env                       # Environment configuration credentials
│   ├── app.js                     # Express app setup
│   ├── server.js                  # Server port 5000 listener
│   └── package.json
│
├── middleware-engine/             # Placeholder for middleware proxies
├── analytics-engine/              # Placeholder for behavioral logs
└── ml-engine/                     # Placeholder for recommendation models

------------------------------------------------------------------------
2. Tech Stack Details
------------------------------------------------------------------------

Frontend Features:
- React with Vite: Ultra-fast hot-reloading development server.
- Tailwind CSS: Modern responsive layout, glassmorphic card elements, and micro-interactions.
- React Router DOM (v6): Client-side navigation mapping and Protected Route guards.
- Axios HTTP Client: Base URL set to port 5000, with a request interceptor to automatically attach 'Bearer <JWT_TOKEN>' from localStorage to all authenticated calls.

Backend Features:
- Express.js on Node.js: Separated app.js and server.js architecture.
- MongoDB via Mongoose: Data schemas featuring indexes, compound keys, and pre-save password-hashing hooks.
- JWT & Bcryptjs: User password verification and secure token generation.

------------------------------------------------------------------------
3. Configuration & Setup
------------------------------------------------------------------------

Step 1: Clone and Install Dependencies
From the root directory, install all required packages recursively (root, client, and server) with:
npm run install-all

Step 2: Configure Environment Variables
Inside the server/ directory, create a .env file containing:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=super_secret_saiof_token_key_9988
NODE_ENV=development

(You can connect either to a local database instance mongodb://127.0.0.1:27017/saiof or your cloud MongoDB Atlas connection string).

Step 3: Seed the Database
Populate your database cluster with 23 hardware, sensor, and storage products:
cd server
node utils/seed.js

------------------------------------------------------------------------
4. Execution Commands
------------------------------------------------------------------------

Start Development Servers
From the root directory:
npm run dev

(Boots the client on http://localhost:5173 and the server on http://localhost:5000 concurrently).

------------------------------------------------------------------------
5. API Endpoints Registry
------------------------------------------------------------------------

Method | Endpoint             | Access  | Purpose
-------|----------------------|---------|---------------------------------------------
GET    | /api/health          | Public  | Verify server health status
POST   | /api/auth/register   | Public  | Register a new user
POST   | /api/auth/login      | Public  | Authenticate user and get JWT
GET    | /api/auth/profile    | Private | Retrieve logged-in user profile
GET    | /api/products        | Public  | Get products list (searched, paginated, sorted)
GET    | /api/products/:id    | Public  | Get product details by ID
POST   | /api/products        | Admin   | Create new catalog item
PUT    | /api/products/:id    | Admin   | Update catalog item properties
DELETE | /api/products/:id    | Admin   | Delete catalog item
GET    | /api/cart            | Private | Get user's active shopping cart
POST   | /api/cart/add        | Private | Add an item to user's cart
PUT    | /api/cart/update/:id | Private | Update quantity of cart item
DELETE | /api/cart/remove/:id | Private | Remove product item from cart

------------------------------------------------------------------------
6. Example Request & Response Payloads
------------------------------------------------------------------------

A. Register User (POST /api/auth/register)
- Request Body:
  {
    "name": "Jane User",
    "email": "jane@saiof.io",
    "password": "securepassword123"
  }
- Response (201 Created):
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "_id": "66554433221100abc1234567",
      "name": "Jane User",
      "email": "jane@saiof.io",
      "role": "user",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }

B. Catalog Products (GET /api/products)
- Response (200 OK after 1500ms artificial delay):
  {
    "success": true,
    "data": [
      {
        "_id": "66554433221100abc1234599",
        "title": "Neural Commerce Accelerator Hub",
        "description": "High-speed local caching and AI orchestration hub built for next-generation headless storefront architectures.",
        "category": "Hardware Systems",
        "price": 299.99,
        "stock": 12,
        "ratings": 4.8,
        "createdAt": "2026-05-28T14:00:00.000Z",
        "updatedAt": "2026-05-28T14:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 6,
      "pages": 1
    }
  }

------------------------------------------------------------------------
7. Performance Telemetry Logger
------------------------------------------------------------------------

The backend has a built-in telemetry logger (loggerMiddleware.js) that captures request details and records them in the RequestLog MongoDB collection:
{
  "_id": "66554433221100abc1234777",
  "endpoint": "/api/products?search=Neural",
  "method": "GET",
  "latency": 1506,
  "statusCode": 200,
  "requestHash": "df87349ab9c87d6e5f43210abced9988",
  "timestamp": "2026-05-28T14:06:50.123Z"
}
This MD5 request signature (requestHash) acts as the foundation for future idempotency checks, caching mechanisms, and load auditing.
