import pandas as pd
from typing import Tuple

class LatencyFeaturePipeline:
    """
    SAIOF Latency Feature Engineering Pipeline
    Isolates full middleware and concurrency metrics as independent features (X)
    and server response performance (averageLatency) as the target variable (y).
    """
    @staticmethod
    def extract_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Extracts independent variables X and target variable y for Latency Bottleneck Prediction.
        Features: ['hour', 'day', 'requestCount', 'cacheHitRatio', 'duplicateRate', 'mergeRate']
        Target: 'averageLatency'
        """
        X = df[['hour', 'day', 'requestCount', 'cacheHitRatio', 'duplicateRate', 'mergeRate']].copy()
        y = df['averageLatency'].copy()
        
        return X, y
