/**
 * SAIOF Middleware Engine - Entry Point
 * 
 * Aggregates, structures, and neatly exports the entire middleware-engine framework.
 * This architecture supplies high-performance business logic for request fingerprinting,
 * in-flight request tracking, dynamic caching, duplicate request blocking, and 
 * request coalescing (Single Flight).
 * 
 * Requirements Met:
 * - CommonJS strictly used.
 * - Zero dependencies on external libraries (pure Javascript & Node core crypto).
 * - Framework-agnostic: Detached from Express.
 * - Adaptable storage contracts designed for seamless Redis swap-ins.
 * - Real-time metrics streaming hooks designed for ML/analytics integration.
 */

// Request Manager Components
const { generateSignature, deepSort } = require('./request-manager/requestSignature');
const { ActiveRequestStoreInterface, MemoryActiveRequestStore } = require('./request-manager/activeRequestStore');
const { RequestTracker } = require('./request-manager/requestTracker');

// Cache Engine Components
const { CacheStoreInterface, MemoryCacheStore, CacheManager } = require('./cache-engine/cacheManager');
const { CachePolicy } = require('./cache-engine/cachePolicy');
const { CacheMetrics } = require('./cache-engine/cacheMetrics');

// Duplicate Detector Components
const { DuplicateMetrics } = require('./duplicate-detector/duplicateMetrics');
const { DuplicateChecker } = require('./duplicate-detector/duplicateChecker');
const { DuplicateTracker } = require('./duplicate-detector/duplicateTracker');
const DuplicateAnalyzer = require('./duplicate-detector/duplicateAnalyzer');

// Merge Engine Components
const { ActivePromiseStore } = require('./merge-engine/activePromiseStore');
const { MergeMetrics } = require('./merge-engine/mergeMetrics');
const { RequestMerger } = require('./merge-engine/requestMerger');

module.exports = {
  RequestManager: {
    generateSignature,
    deepSort,
    ActiveRequestStoreInterface,
    MemoryActiveRequestStore,
    RequestTracker
  },
  CacheEngine: {
    CacheStoreInterface,
    MemoryCacheStore,
    CachePolicy,
    CacheMetrics,
    CacheManager
  },
  DuplicateDetector: {
    DuplicateMetrics,
    DuplicateChecker,
    DuplicateTracker,
    DuplicateAnalyzer
  },
  MergeEngine: {
    ActivePromiseStore,
    MergeMetrics,
    RequestMerger
  }
};
