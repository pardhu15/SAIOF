const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Public health check to confirm server status.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "SAIOF Backend Running"
  });
});

module.exports = router;
