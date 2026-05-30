import pandas as pd
from typing import Tuple

class TrafficFeaturePipeline:
    """
    SAIOF Traffic Feature Engineering Pipeline
    Isolates temporal variables (hour, day) as independent features (X)
    and future request volume (requestCount) as the target variable (y).
    """
    @staticmethod
    def extract_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Extracts independent variables X and target variable y for Traffic Prediction.
        Features: ['hour', 'day']
        Target: 'requestCount'
        """
        # Ensure correct column formats
        X = df[['hour', 'day']].copy()
        y = df['requestCount'].copy()
        
        return X, y
