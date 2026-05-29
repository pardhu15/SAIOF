const mongoose = require('mongoose');

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
    
    throw error;
  }
};

module.exports = connectDB;
