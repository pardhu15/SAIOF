/**
 * SAIOF Common Utility Helpers
 * Standard utility functions for the backend engine.
 */

/**
 * Format custom standard responses.
 */
const formatResponse = (success, message, data = {}) => {
  return {
    success,
    message,
    ...data
  };
};

module.exports = {
  formatResponse
};
