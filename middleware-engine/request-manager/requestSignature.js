/**
 * SAIOF Middleware Engine - Request Signature Generator
 * 
 * This module is responsible for producing stable, unique, and deterministic signatures (fingerprints)
 * for incoming HTTP-like request payloads. These signatures are used by the caching,
 * duplicate detection, and request coalescing engines.
 * 
 * Redis Design: These deterministic signatures serve as the exact keys for Redis hash/string sets.
 * Analytics/ML Design: Standardized signatures allow training of predictive models on route hit patterns.
 */

const crypto = require('crypto');

/**
 * Deeply sorts an object's keys recursively to guarantee deterministic serialization.
 * @param {*} obj - Any input value (object, array, primitive).
 * @returns {*} - The deeply sorted object or primitive.
 */
function deepSort(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSort);
  }
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = deepSort(obj[key]);
  }
  return sortedObj;
}

/**
 * Generates a deterministic SHA-256 signature for a request.
 * 
 * @param {Object} request - The request payload containing core metadata.
 * @param {string} request.method - HTTP method (e.g., 'GET', 'POST').
 * @param {string} request.url - Request URL or target resource path.
 * @param {Object} [request.headers] - Request headers dictionary.
 * @param {Object|string} [request.body] - Request payload body.
 * @param {Object} [request.query] - Parsed query parameters.
 * @param {Object} [options] - Custom signature configuration options.
 * @param {string[]} [options.includeHeaders=['authorization']] - Headers to include in the signature.
 * @param {boolean} [options.ignoreQuery=false] - Whether to bypass query parameters in hashing.
 * @param {boolean} [options.ignoreBody=false] - Whether to bypass request body in hashing.
 * @returns {string} The computed hexadecimal SHA-256 signature.
 */
function generateSignature(request, options = {}) {
  if (!request || !request.method || !request.url) {
    throw new Error('Invalid request object: method and url are required fields.');
  }

  const includeHeaders = options.includeHeaders || ['authorization'];
  const ignoreQuery = options.ignoreQuery || false;
  const ignoreBody = options.ignoreBody || false;

  const normalizedMethod = request.method.toUpperCase();
  const normalizedUrl = request.url.toLowerCase().split('?')[0]; // Strip raw query string, we use structured query instead

  // Extract and normalize relevant headers
  const filteredHeaders = {};
  if (request.headers && typeof request.headers === 'object') {
    for (const headerName of includeHeaders) {
      const lowerName = headerName.toLowerCase();
      // Look up header case-insensitively
      const originalKey = Object.keys(request.headers).find(k => k.toLowerCase() === lowerName);
      if (originalKey) {
        filteredHeaders[lowerName] = String(request.headers[originalKey]).trim();
      }
    }
  }

  // Normalize query parameters
  let queryData = {};
  if (!ignoreQuery && request.query && typeof request.query === 'object') {
    queryData = deepSort(request.query);
  }

  // Normalize request body
  let bodyData = {};
  if (!ignoreBody && request.body) {
    if (typeof request.body === 'string') {
      try {
        bodyData = deepSort(JSON.parse(request.body));
      } catch {
        bodyData = { raw: request.body };
      }
    } else if (typeof request.body === 'object') {
      bodyData = deepSort(request.body);
    } else {
      bodyData = { value: request.body };
    }
  }

  // Create composite request payload structure
  const compositePayload = {
    method: normalizedMethod,
    url: normalizedUrl,
    headers: filteredHeaders,
    query: queryData,
    body: bodyData
  };

  // Deterministically serialize
  const serialized = JSON.stringify(compositePayload);

  // Generate SHA-256 hexadecimal hash
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

module.exports = {
  generateSignature,
  deepSort
};
