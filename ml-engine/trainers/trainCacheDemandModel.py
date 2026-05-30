import os
import sys
import logging
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib
import pickle

# Ensure parent directory is in path for absolute imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("TrainCacheDemandModel")

def train_cache_model(df: pd.DataFrame):
    """
    Trains RandomForestRegressor to forecast cacheHitRatio.
    Saves dual binaries for API and user requested formats.
    """
    logger.info("Training Cache Demand Prediction Model...")
    df_train = df.copy()

    # 1. Target: cacheHitRatio
    y = df_train['cacheHitRatio']

    # 2. Features mapping (replicate endpoints and label-encode them dynamically)
    # Map index modulus to simulate standard catalog endpoints
    df_train['endpoint'] = df_train.index % 3
    features = ['hour', 'endpoint', 'requestCount', 'duplicateRate']
    X = df_train[features]

    # 3. Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Fit model
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)

    # 5. Persist models
    models_dir = os.path.join(parent_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # Save standard .joblib for API hot-reloading
    joblib.dump(model, os.path.join(models_dir, "cache_model.joblib"))
    
    # Save standard .pkl using pickle
    with open(os.path.join(models_dir, "cachePredictor.pkl"), "wb") as f:
        pickle.dump(model, f)
        
    logger.info("Cache Demand Model dual-serialized successfully.")
    return model, X_test, y_test, features

if __name__ == "__main__":
    from collectors.datasetBuilder import DatasetBuilder
    df = DatasetBuilder().build_dataset()
    train_cache_model(df)
