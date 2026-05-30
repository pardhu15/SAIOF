import os
import sys
import logging
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# Ensure parent directory is in path for absolute imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from collectors.datasetBuilder import DatasetBuilder
from features.cacheFeatures import CacheFeaturePipeline

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("TrainCacheModel")

def train_cache_model():
    logger.info("==================================================")
    logger.info("STAGED RUN: Training SAIOF Cache Demand Model")
    logger.info("==================================================")
    
    # 1. Compile dataset
    builder = DatasetBuilder()
    df = builder.build_dataset()
    
    # 2. Extract features & target
    X, y = CacheFeaturePipeline.extract_features(df)
    logger.info(f"Feature matrix dimensions: {X.shape}")
    logger.info(f"Target vector dimensions: {y.shape}")
    logger.info(f"Features: {list(X.columns)}")
    
    # 3. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 4. Initialize and fit RandomForestRegressor
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    logger.info("Fitting RandomForestRegressor model to training telemetry...")
    model.fit(X_train, y_train)
    
    # 5. Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    logger.info("--------------------------------------------------")
    logger.info("MODEL METRICS & PERFORMANCE REPORT:")
    logger.info(f"  - Mean Squared Error (MSE): {mse:.4f}")
    logger.info(f"  - Coefficient of Determination (R^2 Score): {r2:.4f}")
    logger.info("--------------------------------------------------")
    
    # 6. Save model binary
    models_dir = os.path.join(parent_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "cache_model.joblib")
    
    logger.info(f"Persisting trained model to binary: {model_path}")
    joblib.dump(model, model_path)
    logger.info("Cache demand model saved successfully. Pipeline finished.")
    
if __name__ == "__main__":
    train_cache_model()
