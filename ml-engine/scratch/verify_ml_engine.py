import os
import sys
import logging

# Ensure parent directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from collectors.datasetBuilder import DatasetBuilder
from trainers.trainTrafficModel import train_traffic_model
from trainers.trainCacheModel import train_cache_model
from trainers.trainLatencyModel import train_latency_model
from predictors.trafficPredictor import TrafficPredictor
from predictors.cachePredictor import CachePredictor
from predictors.latencyPredictor import LatencyPredictor

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("ML_Engine_Verification")

def run_verification():
    logger.info("==============================================")
    logger.info("  STARTING SAIOF ML ENGINE INTEGRATION TESTS  ")
    logger.info("==============================================")
    
    test_results = {}

    # Test 1: Dataset Compilation
    try:
        logger.info("[TEST 1] Testing DatasetBuilder compilation...")
        builder = DatasetBuilder()
        df = builder.build_dataset()
        assert df is not None, "DatasetBuilder returned None."
        assert not df.empty, "DatasetBuilder returned an empty DataFrame."
        assert "requestCount" in df.columns, "Missing requestCount column."
        assert "cacheHitRatio" in df.columns, "Missing cacheHitRatio column."
        assert "averageLatency" in df.columns, "Missing averageLatency column."
        
        logger.info(f"OK - [TEST 1] Passed! Columns: {list(df.columns)}, Rows: {len(df)}")
        test_results["dataset_builder"] = True
    except Exception as e:
        logger.error(f"FAIL - [TEST 1] Failed: {e}")
        test_results["dataset_builder"] = False

    # Test 2: Training Pipeline
    try:
        logger.info("[TEST 2] Executing Training Pipelines for all models...")
        
        logger.info("Training Traffic Model...")
        train_traffic_model()
        
        logger.info("Training Cache Model...")
        train_cache_model()
        
        logger.info("Training Latency Model...")
        train_latency_model()
        
        # Verify binaries exist
        models_dir = os.path.join(parent_dir, "models")
        traffic_bin = os.path.join(models_dir, "traffic_model.joblib")
        cache_bin = os.path.join(models_dir, "cache_model.joblib")
        latency_bin = os.path.join(models_dir, "latency_model.joblib")
        
        assert os.path.exists(traffic_bin), "traffic_model.joblib was not persisted."
        assert os.path.exists(cache_bin), "cache_model.joblib was not persisted."
        assert os.path.exists(latency_bin), "latency_model.joblib was not persisted."
        
        logger.info("OK - [TEST 2] Passed! All three models successfully trained and persisted.")
        test_results["training_pipelines"] = True
    except Exception as e:
        logger.error(f"FAIL - [TEST 2] Failed: {e}")
        test_results["training_pipelines"] = False

    # Test 3: Inference / Predictors Loading and Chaining
    try:
        logger.info("[TEST 3] Testing Predictors initialization and sample forecasts...")
        
        # Re-initialize predictors (they will load the newly saved binaries)
        traffic_pred = TrafficPredictor()
        cache_pred = CachePredictor()
        latency_pred = LatencyPredictor()
        
        assert traffic_pred.model is not None, "Traffic Predictor failed to load model binary."
        assert cache_pred.model is not None, "Cache Predictor failed to load model binary."
        assert latency_pred.model is not None, "Latency Predictor failed to load model binary."
        
        # Query sample predictions for Wednesday (day=2) at 14:00 (hour=14)
        logger.info("Querying model predictions...")
        traffic_val = traffic_pred.predict(hour=14, day=2)
        cache_val = cache_pred.predict(hour=14, day=2, request_count=int(traffic_val))
        latency_val = latency_pred.predict(
            hour=14, day=2, request_count=int(traffic_val), cache_hit_ratio=cache_val,
            duplicate_rate=0.04, merge_rate=0.03
        )
        
        assert traffic_val > 0, "Predicted traffic volume should be positive."
        assert 0.0 <= cache_val <= 1.0, "Predicted cache hit ratio should be in range [0,1]."
        assert latency_val > 0, "Predicted latency response duration should be positive."
        
        logger.info("Forecast Outputs:")
        logger.info(f"  - Forecasted Traffic Count: {traffic_val:.2f} requests")
        logger.info(f"  - Forecasted Cache Hit Ratio: {cache_val * 100:.2f}%")
        logger.info(f"  - Forecasted Server Latency: {latency_val:.2f} ms")
        
        logger.info("OK - [TEST 3] Passed! Inference works flawlessly with newly trained models.")
        test_results["predictors_inference"] = True
    except Exception as e:
        logger.error(f"FAIL - [TEST 3] Failed: {e}")
        test_results["predictors_inference"] = False

    # Print Summary
    logger.info("==============================================")
    logger.info("          TEST INTEGRATION SUMMARY            ")
    logger.info("==============================================")
    for test, passed in test_results.items():
        status = "PASSED" if passed else "FAILED"
        logger.info(f" {test:<25}: {status}")
    logger.info("==============================================")
    
    return all(test_results.values())

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
