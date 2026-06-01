import os
import sys
import logging
import numpy as np
import pandas as pd

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("DataPreparationPipeline")

# Ensure base ml-engine folder is in sys.path for absolute imports
base_dir = os.path.dirname(os.path.abspath(__file__))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from collectors.datasetBuilder import DatasetBuilder
from features.trafficFeatures import TrafficFeaturePipeline
from features.cacheFeatures import CacheFeaturePipeline
from features.latencyFeatures import LatencyFeaturePipeline

# Dynamic matplotlib import to remain resilient under headless or non-gui environments
try:
    import matplotlib
    matplotlib.use('Agg')  # Headless backend
    import matplotlib.pyplot as plt
    PLOT_AVAILABLE = True
    logger.info("Matplotlib imported successfully in headless mode.")
except ImportError:
    PLOT_AVAILABLE = False
    logger.warning("Matplotlib is not installed. Skipping visualization compilation resiliently.")

class DataPreparationPipeline:
    """
    SAIOF Machine Learning Data Preparation Pipeline
    Orchestrates raw data collection, applies lag and cyclical feature engineering, 
    audits outliers/null values, maps feature importances, and compiles CSVs/PNGs/MD reports.
    """
    def __init__(self):
        self.base_dir = base_dir
        self.data_dir = os.path.join(self.base_dir, "data")
        self.reports_dir = os.path.join(self.base_dir, "reports")
        self.plots_dir = os.path.join(self.data_dir, "visualizations")

        # Create output directories
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)
        os.makedirs(self.plots_dir, exist_ok=True)

    def apply_feature_engineering(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Applies standard feature engineering transformations:
        - Cyclical Temporal Encodings: hour_sin, hour_cos, day_sin, day_cos
        - Lags: requestCount_lag1, averageLatency_lag1
        - Weekend Surge Indicator: is_weekend
        """
        logger.info("Applying feature engineering transformations...")
        df_engineered = df.copy()

        # 1. Cyclical temporal features
        df_engineered['hour_sin'] = np.sin(2 * np.pi * df_engineered['hour'] / 24.0)
        df_engineered['hour_cos'] = np.cos(2 * np.pi * df_engineered['hour'] / 24.0)
        df_engineered['day_sin'] = np.sin(2 * np.pi * df_engineered['day'] / 7.0)
        df_engineered['day_cos'] = np.cos(2 * np.pi * df_engineered['day'] / 7.0)

        # 2. Weekend indicator (Friday=4, Saturday=5, Sunday=6)
        df_engineered['is_weekend'] = df_engineered['day'].apply(lambda d: 1 if d in [4, 5, 6] else 0)

        # 3. Autoregressive Lag Features (Shifted by 1 hour, filled with backward fill to avoid NaN)
        df_engineered['requestCount_lag1'] = df_engineered['requestCount'].shift(1)
        df_engineered['requestCount_lag1'] = df_engineered['requestCount_lag1'].bfill()

        df_engineered['averageLatency_lag1'] = df_engineered['averageLatency'].shift(1)
        df_engineered['averageLatency_lag1'] = df_engineered['averageLatency_lag1'].bfill()

        # Ensure types are floats
        for col in ['hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'is_weekend', 'requestCount_lag1', 'averageLatency_lag1']:
            df_engineered[col] = df_engineered[col].astype(float)

        return df_engineered

    def detect_outliers_iqr(self, df: pd.DataFrame, columns: list) -> dict:
        """
        Detects outlier count per column using Interquartile Range (IQR) method.
        Outliers are values beyond [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
        """
        outlier_report = {}
        for col in columns:
            if df[col].dtype in [np.float64, np.int64, float, int]:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
                outlier_report[col] = {
                    "Q1": float(round(Q1, 4)),
                    "Q3": float(round(Q3, 4)),
                    "IQR": float(round(IQR, 4)),
                    "lower_bound": float(round(lower_bound, 4)),
                    "upper_bound": float(round(upper_bound, 4)),
                    "outlier_count": len(outliers)
                }
        return outlier_report

    def calculate_feature_importances(self, df: pd.DataFrame) -> dict:
        """
        Fits temporary Random Forest Regressors to compute engineered feature 
        importances for Traffic, Cache, and Latency targets.
        """
        from sklearn.ensemble import RandomForestRegressor
        
        importances = {}
        
        # 1. Traffic Prediction Features
        traffic_feats = ['hour', 'day', 'is_weekend', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'requestCount_lag1']
        X_t = df[traffic_feats]
        y_t = df['requestCount']
        rf_t = RandomForestRegressor(n_estimators=50, random_state=42)
        rf_t.fit(X_t, y_t)
        importances['traffic'] = dict(zip(traffic_feats, [round(float(x), 4) for x in rf_t.feature_importances_]))

        # 2. Cache Demand Prediction Features
        cache_feats = ['hour', 'day', 'is_weekend', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'requestCount', 'requestCount_lag1']
        X_c = df[cache_feats]
        y_c = df['cacheHitRatio']
        rf_c = RandomForestRegressor(n_estimators=50, random_state=42)
        rf_c.fit(X_c, y_c)
        importances['cache'] = dict(zip(cache_feats, [round(float(x), 4) for x in rf_c.feature_importances_]))

        # 3. Latency Prediction Features
        latency_feats = ['hour', 'day', 'is_weekend', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'requestCount', 'cacheHitRatio', 'duplicateRate', 'mergeRate', 'requestCount_lag1', 'averageLatency_lag1']
        X_l = df[latency_feats]
        y_l = df['averageLatency']
        rf_l = RandomForestRegressor(n_estimators=50, random_state=42)
        rf_l.fit(X_l, y_l)
        importances['latency'] = dict(zip(latency_feats, [round(float(x), 4) for x in rf_l.feature_importances_]))

        return importances

    def generate_visualizations(self, df: pd.DataFrame, importances: dict):
        """Compiles PNG visual reports for dashboard integration."""
        if not PLOT_AVAILABLE:
            return

        try:
            plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
            
            # Chart 1: Diurnal Seasonality (Average load by hour of day)
            plt.figure(figsize=(10, 5))
            hourly_avg = df.groupby('hour')['requestCount'].mean()
            plt.plot(hourly_avg.index, hourly_avg.values, marker='o', linewidth=2.5, color='#4f46e5')
            plt.title('diurnal Seasonality Curve - Average Request Count by Hour', fontsize=14, pad=15)
            plt.xlabel('Hour of Day (0-23)', fontsize=12)
            plt.ylabel('Average Request Count', fontsize=12)
            plt.xticks(range(0, 24, 2))
            plt.tight_layout()
            chart1_path = os.path.join(self.plots_dir, "hourly_load_seasonality.png")
            plt.savefig(chart1_path, dpi=150)
            plt.close()
            logger.info(f"Saved seasonality visual to: {chart1_path}")

            # Chart 2: Latency Prediction Feature Importances
            plt.figure(figsize=(10, 5))
            lat_imp = pd.Series(importances['latency']).sort_values(ascending=True)
            colors = plt.cm.viridis(np.linspace(0.4, 0.8, len(lat_imp)))
            lat_imp.plot(kind='barh', color=colors)
            plt.title('Feature Importances - Latency Bottleneck Forecasting', fontsize=14, pad=15)
            plt.xlabel('Relative Importance Coefficient', fontsize=12)
            plt.ylabel('Engineered Feature', fontsize=12)
            plt.tight_layout()
            chart2_path = os.path.join(self.plots_dir, "feature_importance_latency.png")
            plt.savefig(chart2_path, dpi=150)
            plt.close()
            logger.info(f"Saved feature importance visual to: {chart2_path}")

            # Chart 3: Correlation Matrix
            plt.figure(figsize=(10, 8))
            numeric_df = df.select_dtypes(include=[np.number])
            corr = numeric_df.corr()
            
            # Custom matplotlib heatmap
            im = plt.imshow(corr, cmap='coolwarm', interpolation='nearest', vmin=-1, vmax=1)
            plt.colorbar(im)
            plt.title('SAIOF Feature Correlation Heatmap Matrix', fontsize=14, pad=15)
            
            # Add axis ticks
            ticks = np.arange(len(corr.columns))
            plt.xticks(ticks, corr.columns, rotation=45, ha='right')
            plt.yticks(ticks, corr.columns)
            
            # Loop over data dimensions and create text annotations.
            for i in range(len(corr.columns)):
                for j in range(len(corr.columns)):
                    plt.text(j, i, f"{corr.iloc[i, j]:.2f}",
                             ha="center", va="center", color="black" if abs(corr.iloc[i, j]) < 0.6 else "white")
            
            plt.tight_layout()
            chart3_path = os.path.join(self.plots_dir, "correlation_matrix.png")
            plt.savefig(chart3_path, dpi=150)
            plt.close()
            logger.info(f"Saved correlation heatmap to: {chart3_path}")

        except Exception as e:
            logger.error(f"Failed to compile visualization charts: {e}")

    def write_markdown_report(self, df: pd.DataFrame, outlier_report: dict, importances: dict):
        """Compiles the formal Markdown Data Diagnostics & Quality Report."""
        report_path = os.path.join(self.reports_dir, "data_preparation_report.md")
        
        # Compile dataset stats
        stats_rows = []
        for col in df.columns:
            if col != 'hour_bin':
                stats_rows.append(
                    f"| **{col}** | {df[col].dtype} | {len(df[col])} | {df[col].mean():.4f} | {df[col].min():.4f} | {df[col].median():.4f} | {df[col].max():.4f} |"
                )
        
        # Compile missing check
        missing_rows = [f"| **{col}** | {df[col].isnull().sum()} | {df[col].isnull().sum() / len(df) * 100:.2f}% |" for col in df.columns]

        # Compile outlier check
        outlier_rows = []
        for col, data in outlier_report.items():
            outlier_rows.append(
                f"| **{col}** | {data['lower_bound']} | {data['upper_bound']} | {data['outlier_count']} | {data['outlier_count'] / len(df) * 100:.2f}% |"
            )

        # Compile Feature Importance tables
        traffic_imp_rows = [f"| **{feat}** | {imp:.4f} |" for feat, imp in sorted(importances['traffic'].items(), key=lambda x: x[1], reverse=True)]
        cache_imp_rows = [f"| **{feat}** | {imp:.4f} |" for feat, imp in sorted(importances['cache'].items(), key=lambda x: x[1], reverse=True)]
        latency_imp_rows = [f"| **{feat}** | {imp:.4f} |" for feat, imp in sorted(importances['latency'].items(), key=lambda x: x[1], reverse=True)]
        data_dir_url = self.data_dir.replace("\\", "/")
        plots_dir_url = self.plots_dir.replace("\\", "/")

        report_content = f"""# SAIOF ML Telemetry Data Preparation & Diagnostics Report

This diagnostic data preparation report summarizes feature engineering, dataset statistics, missing values, outliers, and feature importances calculated across raw telemetry. It qualifies the dataset before production model training begins.

---

## 📈 Dataset Overview
* **Telemetries Extracted**: `requestlogs`, `trafficmetrics`, `cachemetrics`, `duplicatemetrics`, `mergemetrics`
* **Observations Count**: {len(df)} hourly aligned metrics records
* **Engineered Features**: `hour_sin`, `hour_cos`, `day_sin`, `day_cos`, `is_weekend`, `requestCount_lag1`, `averageLatency_lag1`

---

## 📊 Dataset Descriptive Statistics

| Feature Column | Type | Observations | Mean | Min | Median (p50) | Max |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
{"\n".join(stats_rows)}

---

## 🔍 Missing Value Audit & Diagnostics

| Feature Column | Null Count | Null Ratio |
| :--- | :---: | :---: |
{"\n".join(missing_rows)}

---

## 🚨 Outlier Diagnostics (IQR Method)

Outliers are evaluated using the standard Q1/Q3 Interquartile Range boundary: `[Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]`

| Feature Column | Lower Bound | Upper Bound | Outlier Count | Outlier Ratio |
| :--- | :---: | :---: | :---: | :---: |
{"\n".join(outlier_rows)}

---

## 🧠 Random Forest Feature Importances

### 1. Traffic Prediction Model (Target: `requestCount`)
| Feature Name | Relative Importance Coefficient |
| :--- | :---: |
{"\n".join(traffic_imp_rows)}

### 2. Cache Demand Model (Target: `cacheHitRatio`)
| Feature Name | Relative Importance Coefficient |
| :--- | :---: |
{"\n".join(cache_imp_rows)}

### 3. Latency Bottleneck Model (Target: `averageLatency`)
| Feature Name | Relative Importance Coefficient |
| :--- | :---: |
{"\n".join(latency_imp_rows)}

---

## 📂 Serialized Output Dataset Paths

The processed and engineered sub-datasets have been successfully serialized for model training:

1. **Traffic Prediction**: [traffic_processed.csv](file:///{data_dir_url}/traffic_processed.csv)
2. **Latency Prediction**: [latency_processed.csv](file:///{data_dir_url}/latency_processed.csv)
3. **Cache Demand Prediction**: [cache_processed.csv](file:///{data_dir_url}/cache_processed.csv)

Visual analytics compiled:
* [Correlation Heatmap Matrix](file:///{plots_dir_url}/correlation_matrix.png)
* [Feature Importances Spline](file:///{plots_dir_url}/feature_importance_latency.png)
* [Diurnal Load Seasonality splines](file:///{plots_dir_url}/hourly_load_seasonality.png)
"""
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report_content)

        
        logger.info(f"Markdown diagnostics report saved successfully to: {report_path}")

    def run(self):
        """Executes the complete ML data preparation pipeline."""
        logger.info("Initializing ML data preparation run...")
        
        # 1. Compile base hourly-aligned telemetry DataFrame
        builder = DatasetBuilder()
        df_base = builder.build_dataset()

        # 2. Apply feature engineering layer
        df_engineered = self.apply_feature_engineering(df_base)

        # 3. Save processed sub-datasets
        traffic_feats = ['hour', 'day', 'is_weekend', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'requestCount_lag1', 'requestCount']
        df_engineered[traffic_feats].to_csv(os.path.join(self.data_dir, "traffic_processed.csv"), index=False)
        logger.info("Saved traffic_processed.csv")

        cache_feats = ['hour', 'day', 'is_weekend', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'requestCount', 'requestCount_lag1', 'cacheHitRatio']
        df_engineered[cache_feats].to_csv(os.path.join(self.data_dir, "cache_processed.csv"), index=False)
        logger.info("Saved cache_processed.csv")

        latency_feats = ['hour', 'day', 'is_weekend', 'hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'requestCount', 'cacheHitRatio', 'duplicateRate', 'mergeRate', 'requestCount_lag1', 'averageLatency_lag1', 'averageLatency']
        df_engineered[latency_feats].to_csv(os.path.join(self.data_dir, "latency_processed.csv"), index=False)
        logger.info("Saved latency_processed.csv")

        # 4. Outlier Diagnostics
        columns_to_audit = ['requestCount', 'averageLatency', 'cacheHitRatio', 'duplicateRate', 'mergeRate']
        outlier_report = self.detect_outliers_iqr(df_engineered, columns_to_audit)

        # 5. Calculate Feature Importances
        importances = self.calculate_feature_importances(df_engineered)

        # 6. Generate Visualizations
        self.generate_visualizations(df_engineered, importances)

        # 7. Write Markdown diagnostics report
        self.write_markdown_report(df_engineered, outlier_report, importances)

        logger.info("==================================================")
        logger.info("SUCCESS - ML Telemetry Data Preparation Pipeline Complete!")
        logger.info("==================================================")


if __name__ == "__main__":
    pipeline = DataPreparationPipeline()
    pipeline.run()
