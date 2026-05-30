const mongoose = require('mongoose');

let reconnectionTimer = null;

/**
 * Initializes a 10-second background reconnect timer if MongoDB goes offline.
 */
const startReconnectionTimer = () => {
  if (reconnectionTimer) return;

  console.log('[Database] Automated database reconnection retry loop activated (10-second cycles).');
  
  reconnectionTimer = setInterval(async () => {
    if (mongoose.connection.readyState !== 1) {
      const timestamp = new Date().toISOString();
      console.log(`[Database Reconnection] [${timestamp}] Attempting connection to MongoDB Atlas...`);
      try {
        const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saiof';
        const conn = await mongoose.connect(connStr, {
          serverSelectionTimeoutMS: 5000
        });
        
        console.log(`[Database Reconnection] [${new Date().toISOString()}] Successfully connected! Host: ${conn.connection.host}`);
        
        // Auto-seed default admin upon connection recovery
        const seedAdmin = require('../utils/seedAdmin');
        await seedAdmin();

        clearInterval(reconnectionTimer);
        reconnectionTimer = null;
      } catch (err) {
        console.error(`[Database Reconnection Warning] [${new Date().toISOString()}] Connection failed: ${err.message}`);
      }
    } else {
      // Mongoose connected elsewhere, clean up timer
      clearInterval(reconnectionTimer);
      reconnectionTimer = null;
    }
  }, 10000);
};

// Listen to standard mongoose disconnected socket events
mongoose.connection.on('disconnected', () => {
  console.warn(`[Database Alert] [${new Date().toISOString()}] MongoDB connection disconnected! Reconnect loop triggered.`);
  startReconnectionTimer();
});

/**
 * Connects to MongoDB using environment variables.
 * Designed to log status and propagate errors for controlled startup.
 */
const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saiof';
    
    // Connect to database with a 5-second timeout for server selection
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed:`);
    console.error(`  - Name: ${error.name}`);
    console.error(`  - Message: ${error.message}`);
    console.error(`  - Code: ${error.code || 'N/A'}`);
    console.error(`  - Connection State: ${mongoose.connection.readyState}`);

    // Print helpful diagnosis based on common error types
    if (error.message.includes('server selection') || error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      console.error('\n================================================================');
      console.error('DIAGNOSIS TIP:');
      console.error('This error indicates that the application could not connect to any');
      console.error('servers in the MongoDB Atlas cluster within the timeout.');
      console.error('Common causes and solutions:');
      console.error('1. Your network/ISP blocks port 27017 (standard MongoDB port).');
      console.error('2. Your DNS server cannot resolve mongodb+srv records.');
      console.error('   -> Try changing your DNS settings to Google DNS (8.8.8.8)');
      console.error('      or Cloudflare DNS (1.1.1.1).');
      console.error('3. The public IP of your local machine has changed, and the Atlas Network');
      console.error('   Access whitelist needs to be updated to allow your current IP.');
      console.error('================================================================\n');
    }
    
    // Disable Mongoose query buffering on connection failure so that requests fail-fast and fall back gracefully
    mongoose.set('bufferCommands', false);
    console.warn('\n================================================================');
    console.warn('⚠️  DATABASE OFFLINE WARNING:');
    console.warn('This server is operating in OFFLINE/FALLBACK mode.');
    console.warn('All aggregations and telemetries will use high-fidelity local seeds.');
    console.warn('================================================================\n');
    
    return null;
  }
};

module.exports = {
  connectDB,
  startReconnectionTimer
};

