# SAIOF - MERN E-Commerce Storefront (Middleware-Ready Foundation)

SAIOF (Smart AI-Powered Omnichannel Frontend/Backend) E-Commerce Storefront is a clean, production-ready MERN stack application designed with a highly decoupled, service-oriented architecture. 

> [!IMPORTANT]
> **Project Scope Clarification**  
> This repository contains the **completed e-commerce storefront website foundation** (the client catalog interface, shopping cart functionality, JWT authentication flow, and database models). It is engineered with a "middleware-ready" architecture. It does **not** yet contain the advanced SAIOF optimization framework (Redis caching layers, request merging proxies, analytics databases, or ML traffic prediction pipelines).

---

## 💻 Tech Stack

### Frontend Client
*   **Core Library:** React (Vite-powered)
*   **Routing:** React Router DOM (v6+)
*   **State Management:** React Context API (`AuthContext`)
*   **HTTP Client:** Axios (centralized configuration with auto-JWT headers)
*   **Styling:** Tailwind CSS (modern dark-theme glassmorphic layouts)

### Backend Service
*   **Server Framework:** Express.js on Node.js
*   **Database ODM:** Mongoose (MongoDB)
*   **Authentication:** JSON Web Tokens (JWT) & bcryptjs (password hashing)
*   **Utilities:** Node `crypto` (query MD5 hashing signature)

---

## ⚙️ Key Project Features

1.  **Dynamic Storefront Catalog:** Search, category-filtering, price/rating sorting, and pagination served directly from MongoDB.
2.  **Stateful Shopping Cart:** Persistent shopping carts linked to authenticated database profiles, calculating subtotals and totals dynamically from database product documents on every mutation.
3.  **Secure Authentication:** Secure onboarding and sign-in gates with password hashing, localStorage JWT persistence, and route protection guards.
4.  **Telemetry Request Logging:** Custom logger middleware capturing methods, status codes, latency, and MD5 query signatures in the database to audit API performance.
5.  **Simulated Production Latency:** GET endpoints include a 1500ms delay to simulate legacy database strain, serving as the benchmark target for future middleware caching trials.

---

## 📁 Repository Structure

```text
SAIOF/
├── client/                        # React Frontend (Vite & Tailwind CSS)
│   ├── public/
│   └── src/
│       ├── api/apiClient.js       # Centralized HTTP request layer
│       ├── components/            # Reusable UI (AppLoader, Loader, ProductCard, CartItem)
│       ├── context/AuthContext.js # Global login session manager
│       ├── pages/                 # Home, ProductDetails, Login, Register, Cart, My Account
│       └── App.jsx                # Layouts & protected paths router
│
├── server/                        # Express Backend
│   ├── config/db.js               # MongoDB Mongoose connector
│   ├── controllers/               # Thin controllers managing req/res
│   ├── middleware/                # JWT guard, error handler, metrics, logger
│   ├── models/                    # User, Product, Cart, RequestLog schemas
│   ├── routes/                    # API route handlers
│   ├── services/                  # Business services containing database queries
│   └── utils/seed.js              # Database catalog seeder script (23 items)
│
├── middleware-engine/             # Placeholder (future optimization engine)
├── analytics-engine/              # Placeholder (future behavioral logger)
└── ml-engine/                     # Placeholder (future traffic prediction)
```

---

## 🚀 Setup & Installation

### Prerequisite
Make sure you have [Node.js](https://nodejs.org/) installed, and a MongoDB database active (either locally or on a remote [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster).

### 1. Install Dependencies
Run the install script from the root folder to set up packages recursively:
```bash
npm run install-all
```

### 2. Configure Environment Variables
Inside the `server/` directory, create a `.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/saiof?retryWrites=true&w=majority
JWT_SECRET=super_secret_token_key_9988
NODE_ENV=development
```

### 3. Seed Products Database
Run the seed script from the `server/` folder to populate the catalog with 23 hardware, sensor, and storage items:
```bash
cd server
node utils/seed.js
```

### 4. Run Development Stack
From the root directory, launch the concurrent startup scripts:
```bash
npm run dev
```
- Frontend will boot at: `http://localhost:5173`
- Backend will boot at: `http://localhost:5000`

---

## 📡 API Endpoints Catalog

*   **Public Diagnostics:** `GET /api/health`
*   **Auth Actions:**
    *   `POST /api/auth/register` (Registers user, returns JWT)
    *   `POST /api/auth/login` (Authenticates user, returns JWT)
    *   `GET /api/auth/profile` (Protected: Retrieves user profile metadata)
*   **Product Catalog:**
    *   `GET /api/products` (Searches, filters, sorts catalog with simulated 1500ms delay)
    *   `GET /api/products/:id` (Retrieves single product metadata with simulated 1500ms delay)
*   **Shopping Cart:**
    *   `GET /api/cart` (Protected: Loads active cart list)
    *   `POST /api/cart/add` (Protected: Adds items to cart)
    *   `PUT /api/cart/update/:productId` (Protected: Changes quantity)
    *   `DELETE /api/cart/remove/:productId` (Protected: Deletes item from cart)

---

## 🔮 Future Optimization Scope (SAIOF Framework)

The scalable structure of this storefront enables seamless integration of the future SAIOF optimization layers:
1.  **Redis Caching Proxy:** The `cacheMiddleware.js` will connect to local Redis keys. By referencing incoming MD5 `requestHash` logs, it can serve catalog queries instantly, bypassing the 1500ms Mongoose delay.
2.  **Request Merging & Idempotency:** The `duplicateMiddleware.js` will intercept simultaneous duplicate database operations using MD5 signatures, returning cached responses to eliminate duplicate clicks.
3.  **ML Traffic Analytics:** Telemetry logged in the `RequestLog` and `TrafficMetric` schemas will feed predictive models inside `ml-engine` to forecast high-demand paths and trigger preemptive cache warming.

---

## 📸 Storefront Screenshots

Add your project preview images here for a professional GitHub repository presentation:

* **Home Page Catalog:**
  ![Home Catalog](https://via.placeholder.com/800x450.png?text=SAIOF+E-Commerce+Catalog+Dashboard+Theme)
  *(Sleek, modern glassmorphic theme catalog displaying premium hardware and sensors with real-time pagination, filters, and search functionality)*

* **Product Details Action View:**
  ![Product Details View](https://via.placeholder.com/800x450.png?text=SAIOF+Product+Details+View)
  *(Detailed view of a selected hardware component with dynamic ratings, live stock inventory counters, quantity selector, and secure cart addition)*

* **Shopping Cart Interface:**
  ![Shopping Cart](https://via.placeholder.com/800x450.png?text=SAIOF+Shopping+Cart)
  *(Stateful cart view reflecting items added, subtotal/total calculations, and quantities, with checkout gateways ready for middleware integration)*

* **My Account Customer Dashboard:**
  ![My Account](https://via.placeholder.com/800x450.png?text=SAIOF+My+Account+Dashboard)
  *(A clean customer-centric account center showing user profile details, recent order history list, and active session summaries)*

