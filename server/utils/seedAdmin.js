const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Automatically seeds default admin credentials when MongoDB is connected.
 */
const seedAdmin = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[Seed Warning] MongoDB is offline. Skipping database admin seeding. Fallback memory profiles are active.');
    return;
  }

  try {
    const adminEmail = 'admin@saiof.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log(`[Seed] Admin user (${adminEmail}) not found. Seeding default admin account...`);
      await User.create({
        name: 'SAIOF Admin',
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('[Seed] Default admin account seeded successfully.');
    } else {
      console.log('[Seed] Default admin account already exists.');
    }
  } catch (error) {
    console.error(`[Seed Error] Database seeding failed: ${error.message}`);
  }
};

module.exports = seedAdmin;
