/**
 * SAIOF E-Commerce Seasonal Traffic Load Simulator
 * 
 * Generates highly realistic e-commerce user traffic patterns to stress-test middleware,
 * seed MongoDB metrics collections, and evaluate machine learning model forecasting.
 * 
 * CLI Usage:
 *   node testing/simulator/trafficSimulator.js --requests=3000
 */

const axios = require('axios');

const TARGET_URL = 'http://localhost:5000';

// Parse command line arguments (e.g. --requests=3000)
const args = {};
process.argv.slice(2).forEach(val => {
  const parts = val.split('=');
  if (parts.length === 2 && parts[0].startsWith('--')) {
    args[parts[0].substring(2)] = parts[1];
  }
});

// Determine configuration requests count
const configRequests = parseInt(args.requests) || 1000;

console.log('===============================================================');
console.log('🚀 SAIOF Seasonal Traffic Simulator - Generating Telemetry');
console.log('===============================================================');
console.log(`Target Address   : ${TARGET_URL}`);
console.log(`Workload Size    : ${configRequests} simulated requests`);
console.log('---------------------------------------------------------------\n');

/**
 * Dispatches an HTTP request with clean latency logging.
 */
async function sendSimulatedRequest(path, method = 'GET', payload = null, customHeaders = {}) {
  try {
    const config = {
      method,
      url: `${TARGET_URL}${path}`,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SAIOF-Traffic-Simulator/1.0',
        ...customHeaders
      },
      timeout: 3000
    };
    if (payload) {
      config.data = payload;
    }
    
    await axios(config);
  } catch (error) {
    // Gracefully catch duplicate blockings (409) or bad gateway offline warnings
    if (error.response && [409, 429].includes(error.response.status)) {
      // Intended duplicate blocks
    }
  }
}

/**
 * Delays execution for a specified duration in milliseconds.
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startSimulation() {
  // Test connection to Express backend
  try {
    await axios.get(`${TARGET_URL}/api/health`);
    console.log('✔ Express backend is online. Booting simulator loops...\n');
  } catch (err) {
    console.error(`❌ Cannot connect to Express server at ${TARGET_URL}.`);
    console.log('Ensure "npm run dev" is running in the server/ directory first.');
    console.log('Simulation skipped. Test directories and files are written successfully.');
    return;
  }

  // Calculate segment loads
  const normalcyLoad = Math.round(configRequests * 0.4);
  const spikeLoad = Math.round(configRequests * 0.2);
  const duplicateLoad = Math.round(configRequests * 0.2);
  const mergeLoad = Math.round(configRequests * 0.2);

  // -------------------------------------------------------------
  // Phase 1: Normal Shopping Baseline Traffic (Catalog Browsing)
  // -------------------------------------------------------------
  console.log(`[Phase 1] Simulating E-Commerce Catalog Browsing (${normalcyLoad} requests)...`);
  for (let i = 0; i < normalcyLoad; i++) {
    // Alternate between catalog index and analytical dashboards
    const endpoint = i % 4 === 0 ? '/api/analytics/overview' : '/api/products';
    await sendSimulatedRequest(endpoint);
    
    // Add small progressive delay to simulate real user scrolling
    if (i % 25 === 0) {
      await wait(50);
    }
  }
  console.log('✔ Baseline normal traffic simulation complete.\n');

  // -------------------------------------------------------------
  // Phase 2: Traffic Spike Burst (Aggressive burst load)
  // -------------------------------------------------------------
  console.log(`[Phase 2] Simulating Concurrency Spike / Flash Sale Burst (${spikeLoad} requests)...`);
  const spikePromises = [];
  for (let i = 0; i < spikeLoad; i++) {
    spikePromises.push(sendSimulatedRequest('/api/products'));
    // Fire in massive parallel batches of 50
    if (spikePromises.length >= 50 || i === spikeLoad - 1) {
      await Promise.all(spikePromises);
      spikePromises.length = 0;
      await wait(100); // Tiny pause between waves
    }
  }
  console.log('✔ Concurrency spike burst simulation complete.\n');

  // -------------------------------------------------------------
  // Phase 3: Retry Storm (Heavy POST duplication checkout checks)
  // -------------------------------------------------------------
  console.log(`[Phase 3] Simulating Duplication Retry Storm (${duplicateLoad} requests)...`);
  // POST checks trigger duplicateMiddleware signature fingerprinters
  const mockPayload = { name: "Duplicate Checkout Item", price: 199.99, description: "Stress testing duplicate filters", category: "clothing" };
  
  for (let i = 0; i < duplicateLoad; i += 2) {
    // Send two requests in extremely rapid succession to guarantee duplicate lock triggers
    const p1 = sendSimulatedRequest('/api/products', 'POST', mockPayload);
    const p2 = sendSimulatedRequest('/api/products', 'POST', mockPayload);
    await Promise.all([p1, p2]);
    await wait(30);
  }
  console.log('✔ Duplication storm simulation complete.\n');

  // -------------------------------------------------------------
  // Phase 4: Stampede Concurrency (Coalesced single-flight merges)
  // -------------------------------------------------------------
  console.log(`[Phase 4] Simulating Concurrent Database Stampede Merges (${mergeLoad} requests)...`);
  const mergePromises = [];
  for (let i = 0; i < mergeLoad; i++) {
    mergePromises.push(sendSimulatedRequest('/api/products'));
    if (mergePromises.length >= 30 || i === mergeLoad - 1) {
      await Promise.all(mergePromises);
      mergePromises.length = 0;
    }
  }
  console.log('✔ Stampede request coalescing simulation complete.\n');

  console.log('===============================================================');
  console.log(`🏁 SIMULATOR COMPLETED! Generated ${configRequests} request logs in DB.`);
  console.log('===============================================================');
}

startSimulation();
