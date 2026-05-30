require('dotenv').config();
console.log(process.env.MONGO_URI ? "MONGO_URI Loaded" : "MONGO_URI Missing");

const app = require('./app');
const { connectDB, startReconnectionTimer } = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

// Determine Port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start Express server
const startServer = async () => {
  let dbConnected = false;
  try {
    const conn = await connectDB();
    dbConnected = !!conn;
    if (dbConnected) {
      // Seed default admin account
      await seedAdmin();
    } else {
      // Begin 10-second automatic reconnection retry loop
      startReconnectionTimer();
    }
  } catch (error) {
    console.warn(`[Database Warning] Failed to connect: ${error.message}. Booting Express in OFFLINE/FALLBACK mode.`);
    dbConnected = false;
    startReconnectionTimer();
  }

  
  const server = app.listen(PORT, () => {
    console.log(`[Server] SAIOF backend running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    console.log(`[Server] Database Status: ${dbConnected ? 'ONLINE' : 'OFFLINE (Automatic Fallback Seeding Active)'}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`[Fatal Server Error] Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();
