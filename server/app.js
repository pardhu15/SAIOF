const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Middleware Imports
const loggerMiddleware = require('./middleware/loggerMiddleware');
const duplicateMiddleware = require('./middleware/duplicateMiddleware');
const mergeMiddleware = require('./middleware/mergeMiddleware');
const metricsMiddleware = require('./middleware/metricsMiddleware');
const errorHandler = require('./middleware/errorMiddleware');

// Route Imports
const healthRoute = require('./routes/healthRoute');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const mlRoutes = require('./routes/mlRoutes');

const app = express();

// Standard Request Processing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - allowing connection from port 5173
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Third-party Logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// SAIOF Custom Core Middlewares
app.use(loggerMiddleware);
app.use(metricsMiddleware);
app.use(mergeMiddleware);
app.use(duplicateMiddleware);

// Base API Routes
app.use('/api/health', healthRoute);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ml', mlRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
