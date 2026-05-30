import os
import sys
import logging
from datetime import datetime
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure parent directory is in sys.path to permit clean imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from collectors.mongoCollector import MongoCollector
from predictors.trafficPredictor import TrafficPredictor
from predictors.cachePredictor import CachePredictor
from predictors.latencyPredictor import LatencyPredictor
from predictors.recommendationEngine import RecommendationEngine

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SAIOF_FastAPI")

# Initialize database connector, prediction models, and recommendation engine
mongo_collector = MongoCollector()
traffic_predictor = TrafficPredictor()
cache_predictor = CachePredictor()
latency_predictor = LatencyPredictor()
recommendation_engine = RecommendationEngine()

# Initialize FastAPI app
app = FastAPI(
    title="SAIOF Machine Learning Engine API",
    description="Microservice providing forecasting for server traffic, cache hit ratios, and latency bottlenecks.",
    version="1.0.0"
)

# Enable CORS for frontend dashboard calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthStatus(BaseModel):
    status: str
    database_connected: bool
    traffic_model_loaded: bool
    cache_model_loaded: bool
    latency_model_loaded: bool
    timestamp: datetime

@app.get("/", tags=["Health"])
def root_endpoint():
    """Welcome and health-check entrypoint."""
    return {
        "service": "SAIOF Machine Learning Engine",
        "status": "online",
        "api_docs": "/docs"
    }

@app.get("/health", response_model=HealthStatus, tags=["Health"])
def health_endpoint():
    """Returns the initialization status of models and database connections."""
    return HealthStatus(
        status="green",
        database_connected=mongo_collector.connected,
        traffic_model_loaded=traffic_predictor.model is not None,
        cache_model_loaded=cache_predictor.model is not None,
        latency_model_loaded=latency_predictor.model is not None,
        timestamp=datetime.utcnow()
    )

@app.get("/predict/traffic", tags=["Forecasting"])
def predict_traffic(
    hour: int = Query(None, description="Hour of the day to forecast (0-23). Defaults to current hour."),
    day: int = Query(None, description="Day of the week (0-6 where 0=Monday, 6=Sunday). Defaults to current day.")
):
    """
    GET /predict/traffic
    Forecasts future request counts based on temporal server trends.
    Persists prediction and confidence in MongoDB 'predictionhistory' collection.
    """
    now = datetime.utcnow()
    target_hour = hour if hour is not None else now.hour
    target_day = day if day is not None else now.weekday()
    
    try:
        prediction, confidence = traffic_predictor.predict(target_hour, target_day)
        predicted_traffic = int(round(prediction))
        predicted_confidence = int(round(confidence))

        # Generate recommendation
        recommendation = "Traffic spike expected. Increase cache TTL." if predicted_traffic > 1000 else "Traffic is stable. Maintain default cache TTL."
        
        # Save to database
        mongo_collector.save_prediction_history("traffic", predicted_traffic, predicted_confidence, recommendation)
        
        return {
            "predictedTraffic": predicted_traffic,
            "confidence": predicted_confidence,
            "predictionType": "traffic",
            "hour": target_hour,
            "day": target_day,
            "recommendation": recommendation,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error in traffic prediction endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/cache", tags=["Forecasting"])
def predict_cache(
    hour: int = Query(None, description="Hour of the day (0-23). Defaults to current hour."),
    day: int = Query(None, description="Day of the week (0-6). Defaults to current day."),
    requestCount: int = Query(None, description="Estimated requests volume. Defaults to forecasting using Traffic model."),
    duplicateRate: float = Query(0.05, description="Estimated duplicate request rate.")
):
    """
    GET /predict/cache
    Forecasts future cache demand hit ratio based on temporal characteristics and concurrent load.
    Persists prediction in MongoDB 'predictionhistory' collection.
    """
    now = datetime.utcnow()
    target_hour = hour if hour is not None else now.hour
    target_day = day if day is not None else now.weekday()
    
    # Dynamic Chaining: If requestCount is missing, use Traffic Predictor to estimate it
    if requestCount is None:
        logger.info("requestCount not provided. Chaining Traffic Predictor to estimate load...")
        predicted_traffic, _ = traffic_predictor.predict(target_hour, target_day)
        requestCount = int(round(predicted_traffic))
        
    try:
        prediction, confidence = cache_predictor.predict(
            hour=target_hour, day=target_day, requestCount=requestCount, duplicateRate=duplicateRate
        )
        predicted_confidence = int(round(confidence))

        # Map cache hit ratio to categorical cache demand
        # Lower cache hit ratio triggers HIGHER demand for caching improvements
        predictedCacheDemand = "LOW"
        if prediction < 0.70:
            predictedCacheDemand = "HIGH"
        elif prediction < 0.85:
            predictedCacheDemand = "MEDIUM"

        # Generate recommendation
        recommendation = "Optimize cache hit ratios. Enhance server cache storage limits." if predictedCacheDemand == "HIGH" else "Cache efficiency is stable."
        
        # Save to database
        mongo_collector.save_prediction_history("cache", predictedCacheDemand, predicted_confidence, recommendation)
        
        return {
            "predictedCacheDemand": predictedCacheDemand,
            "confidence": predicted_confidence,
            "predictedHitRatio": float(round(prediction, 4)),
            "predictionType": "cache",
            "hour": target_hour,
            "day": target_day,
            "inputRequestCount": requestCount,
            "recommendation": recommendation,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error in cache prediction endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/latency", tags=["Forecasting"])
def predict_latency(
    hour: int = Query(None, description="Hour of the day (0-23). Defaults to current hour."),
    day: int = Query(None, description="Day of the week (0-6). Defaults to current day."),
    requestCount: int = Query(None, description="Estimated requests volume. Defaults to forecasting using Traffic model."),
    cacheHitRatio: float = Query(None, description="Estimated cache hit ratio. Defaults to forecasting using Cache model."),
    duplicateRate: float = Query(0.05, description="Duplicate requests rate (0.0 - 1.0)."),
    mergeRate: float = Query(0.02, description="Request merge rate (0.0 - 1.0).")
):
    """
    GET /predict/latency
    Forecasts average response latencies (ms) based on server load and middleware efficacy.
    Persists prediction in MongoDB 'predictionhistory' collection.
    """
    now = datetime.utcnow()
    target_hour = hour if hour is not None else now.hour
    target_day = day if day is not None else now.weekday()
    
    # 1. Chain traffic predictor if requestCount is missing
    if requestCount is None:
        logger.info("requestCount not provided. Chaining Traffic Predictor to estimate load...")
        predicted_traffic, _ = traffic_predictor.predict(target_hour, target_day)
        requestCount = int(round(predicted_traffic))
        
    # 2. Chain cache predictor if cacheHitRatio is missing
    if cacheHitRatio is None:
        logger.info("cacheHitRatio not provided. Chaining Cache Predictor to estimate efficiency...")
        predicted_cache_ratio, _ = cache_predictor.predict(
            hour=target_hour, day=target_day, requestCount=requestCount, duplicateRate=duplicateRate
        )
        cacheHitRatio = predicted_cache_ratio
        
    try:
        prediction, confidence = latency_predictor.predict(
            requestCount=requestCount,
            cacheHitRatio=cacheHitRatio,
            duplicateRate=duplicateRate,
            mergeRate=mergeRate,
            hour=target_hour,
            day=target_day
        )
        predicted_latency = int(round(prediction))
        predicted_confidence = int(round(confidence))

        # Generate recommendation
        recommendation = "Enable aggressive cache strategy." if predicted_latency > 100 else "Latency is stable. Standard cache strategy active."
        
        # Save to database
        mongo_collector.save_prediction_history("latency", predicted_latency, predicted_confidence, recommendation)
        
        return {
            "predictedLatency": predicted_latency,
            "confidence": predicted_confidence,
            "predictionType": "latency",
            "hour": target_hour,
            "day": target_day,
            "inputRequestCount": requestCount,
            "inputCacheHitRatio": float(round(cacheHitRatio, 4)),
            "inputDuplicateRate": duplicateRate,
            "inputMergeRate": mergeRate,
            "recommendation": recommendation,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error in latency prediction endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/recommendations", tags=["Recommendation"])
def predict_recommendations(
    hour: int = Query(None, description="Hour of the day. Defaults to current hour."),
    day: int = Query(None, description="Day of the week. Defaults to current day."),
    duplicateRate: float = Query(0.05, description="Duplicate requests rate (0.0 - 1.0)."),
    mergeRate: float = Query(0.02, description="Request merge rate (0.0 - 1.0).")
):
    """
    GET /predict/recommendations
    Aggregates predicted traffic, latency, cache hits, and other middleware metrics
    to compile composite, self-optimizing recommendations.
    """
    now = datetime.utcnow()
    target_hour = hour if hour is not None else now.hour
    target_day = day if day is not None else now.weekday()
    
    try:
        # Chain model predictions
        predicted_traffic, traffic_conf = traffic_predictor.predict(target_hour, target_day)
        
        predicted_cache_ratio, cache_conf = cache_predictor.predict(
            hour=target_hour, day=target_day, requestCount=predicted_traffic, duplicateRate=duplicateRate
        )
        
        predicted_latency, latency_conf = latency_predictor.predict(
            requestCount=predicted_traffic,
            cacheHitRatio=predicted_cache_ratio,
            duplicateRate=duplicateRate,
            mergeRate=mergeRate,
            hour=target_hour,
            day=target_day
        )
        
        # Generate recommendations list
        recommendations = recommendation_engine.generate_recommendations(
            predicted_traffic=predicted_traffic,
            predicted_latency=predicted_latency,
            cache_hit_ratio=predicted_cache_ratio,
            duplicate_rate=duplicateRate,
            merge_rate=mergeRate
        )
        
        # Generate primary headline recommendation
        composite_rec = recommendation_engine.get_composite_recommendation(
            predicted_traffic=predicted_traffic,
            predicted_latency=predicted_latency,
            cache_hit_ratio=predicted_cache_ratio,
            duplicate_rate=duplicateRate,
            merge_rate=mergeRate
        )
        
        return {
            "success": True,
            "predictedTraffic": int(round(predicted_traffic)),
            "predictedLatency": int(round(predicted_latency)),
            "predictedCacheRatio": float(round(predicted_cache_ratio, 4)),
            "duplicateRate": duplicateRate,
            "mergeRate": mergeRate,
            "recommendations": recommendations,
            "primaryRecommendation": composite_rec,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error compiling recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

