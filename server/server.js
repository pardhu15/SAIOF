require('dotenv').config();
console.log(process.env.MONGO_URI ? "MONGO_URI Loaded" : "MONGO_URI Missing");

const app = require('./app');
const connectDB = require('./config/db');

// Determine Port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start Express server
const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`[Server] SAIOF backend running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error(`[Fatal Server Error] Unhandled Rejection: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`[Fatal Server Error] Server failed to start due to database connection error.`);
    process.exit(1);
  }
};

startServer();
