const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const checkAdmin = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saiof';
    console.log(`Connecting to ${connStr}...`);
    await mongoose.connect(connStr);
    
    const count = await User.countDocuments();
    console.log(`Total users in DB: ${count}`);
    
    const admin = await User.findOne({ email: 'admin@saiof.com' });
    if (admin) {
      console.log('Admin user found:', {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      });
    } else {
      console.log('Admin user NOT found.');
    }
    
    const allUsers = await User.find({});
    console.log('All users in DB:', allUsers.map(u => ({ email: u.email, role: u.role })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin:', error.message);
    process.exit(1);
  }
};

checkAdmin();
