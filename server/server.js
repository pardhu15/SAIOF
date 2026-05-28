const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Determine Port
const PORT = process.env.PORT || 5000;

// Listen
const server = app.listen(PORT, () => {
  console.log(`[Server] SAIOF backend running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`[Fatal Server Error] Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
