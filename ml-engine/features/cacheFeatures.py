import pandas as pd
from typing import Tuple

class CacheFeaturePipeline:
    """
    SAIOF Cache Feature Engineering Pipeline
    Isolates temporal and traffic load variables as independent features (X)
    and future cache efficiency (cacheHitRatio) as the target variable (y).
    """
    @staticmethod
    def extract_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Extracts independent variables X and target variable y for Cache Demand Prediction.
        Features: ['hour', 'day', 'requestCount']
        Target: 'cacheHitRatio'
        """
        X = df[['hour', 'day', 'requestCount']].copy()
        y = df['cacheHitRatio'].copy()
        
        return X, y
