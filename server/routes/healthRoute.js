const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /api/health
 * Public health check to confirm server and database status.
 */
router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  
  res.status(200).json({
    success: true,
    message: "SAIOF Backend Running",
    database: dbStatus
  });
});

module.exports = router;

