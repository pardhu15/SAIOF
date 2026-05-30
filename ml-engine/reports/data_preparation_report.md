# SAIOF ML Telemetry Data Preparation & Diagnostics Report

This diagnostic data preparation report summarizes feature engineering, dataset statistics, missing values, outliers, and feature importances calculated across raw telemetry. It qualifies the dataset before production model training begins.

---

## 📈 Dataset Overview
* **Telemetries Extracted**: `requestlogs`, `trafficmetrics`, `cachemetrics`, `duplicatemetrics`, `mergemetrics`
* **Observations Count**: 337 hourly aligned metrics records
* **Engineered Features**: `hour_sin`, `hour_cos`, `day_sin`, `day_cos`, `is_weekend`, `requestCount_lag1`, `averageLatency_lag1`

---

## 📊 Dataset Descriptive Statistics

| Feature Column | Type | Observations | Mean | Min | Median (p50) | Max |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **hour** | int64 | 337 | 11.4926 | 0.0000 | 11.0000 | 23.0000 |
| **day** | int64 | 337 | 3.0059 | 0.0000 | 3.0000 | 6.0000 |
| **requestCount** | int64 | 337 | 107.6884 | 10.0000 | 113.0000 | 194.0000 |
| **averageLatency** | float64 | 337 | 100.0576 | 44.1558 | 102.1292 | 153.0788 |
| **cacheHitRatio** | float64 | 337 | 0.8381 | 0.7403 | 0.8374 | 0.9098 |
| **duplicateRate** | float64 | 337 | 0.0362 | 0.0100 | 0.0362 | 0.0669 |
| **mergeRate** | float64 | 337 | 0.0221 | 0.0000 | 0.0216 | 0.0538 |
| **hour_sin** | float64 | 337 | 0.0021 | -1.0000 | 0.0000 | 1.0000 |
| **hour_cos** | float64 | 337 | -0.0021 | -1.0000 | -0.0000 | 1.0000 |
| **day_sin** | float64 | 337 | -0.0029 | -0.9749 | 0.0000 | 0.9749 |
| **day_cos** | float64 | 337 | -0.0007 | -0.9010 | -0.2225 | 1.0000 |
| **is_weekend** | float64 | 337 | 0.4303 | 0.0000 | 0.0000 | 1.0000 |
| **requestCount_lag1** | float64 | 337 | 107.6914 | 10.0000 | 113.0000 | 194.0000 |
| **averageLatency_lag1** | float64 | 337 | 100.0581 | 44.1558 | 102.1292 | 153.0788 |

---

## 🔍 Missing Value Audit & Diagnostics

| Feature Column | Null Count | Null Ratio |
| :--- | :---: | :---: |
| **hour_bin** | 0 | 0.00% |
| **hour** | 0 | 0.00% |
| **day** | 0 | 0.00% |
| **requestCount** | 0 | 0.00% |
| **averageLatency** | 0 | 0.00% |
| **cacheHitRatio** | 0 | 0.00% |
| **duplicateRate** | 0 | 0.00% |
| **mergeRate** | 0 | 0.00% |
| **hour_sin** | 0 | 0.00% |
| **hour_cos** | 0 | 0.00% |
| **day_sin** | 0 | 0.00% |
| **day_cos** | 0 | 0.00% |
| **is_weekend** | 0 | 0.00% |
| **requestCount_lag1** | 0 | 0.00% |
| **averageLatency_lag1** | 0 | 0.00% |

---

## 🚨 Outlier Diagnostics (IQR Method)

Outliers are evaluated using the standard Q1/Q3 Interquartile Range boundary: `[Q1 - 1.5 * IQR, Q3 + 1.5 * IQR]`

| Feature Column | Lower Bound | Upper Bound | Outlier Count | Outlier Ratio |
| :--- | :---: | :---: | :---: | :---: |
| **requestCount** | -18.0 | 230.0 | 0 | 0.00% |
| **averageLatency** | 26.8144 | 171.7875 | 0 | 0.00% |
| **cacheHitRatio** | 0.7558 | 0.9191 | 1 | 0.30% |
| **duplicateRate** | 0.0086 | 0.063 | 1 | 0.30% |
| **mergeRate** | -0.0101 | 0.0539 | 0 | 0.00% |

---

## 🧠 Random Forest Feature Importances

### 1. Traffic Prediction Model (Target: `requestCount`)
| Feature Name | Relative Importance Coefficient |
| :--- | :---: |
| **hour** | 0.4593 |
| **requestCount_lag1** | 0.3927 |
| **hour_cos** | 0.0583 |
| **day_sin** | 0.0265 |
| **day** | 0.0234 |
| **hour_sin** | 0.0207 |
| **is_weekend** | 0.0138 |
| **day_cos** | 0.0053 |

### 2. Cache Demand Model (Target: `cacheHitRatio`)
| Feature Name | Relative Importance Coefficient |
| :--- | :---: |
| **requestCount** | 0.3234 |
| **requestCount_lag1** | 0.2631 |
| **hour_cos** | 0.0933 |
| **day_sin** | 0.0788 |
| **hour_sin** | 0.0741 |
| **hour** | 0.0737 |
| **day_cos** | 0.0450 |
| **day** | 0.0430 |
| **is_weekend** | 0.0056 |

### 3. Latency Bottleneck Model (Target: `averageLatency`)
| Feature Name | Relative Importance Coefficient |
| :--- | :---: |
| **requestCount** | 0.9723 |
| **mergeRate** | 0.0055 |
| **cacheHitRatio** | 0.0040 |
| **duplicateRate** | 0.0040 |
| **averageLatency_lag1** | 0.0035 |
| **requestCount_lag1** | 0.0026 |
| **hour_sin** | 0.0017 |
| **hour** | 0.0016 |
| **hour_cos** | 0.0014 |
| **day_sin** | 0.0013 |
| **day** | 0.0011 |
| **day_cos** | 0.0010 |
| **is_weekend** | 0.0001 |

---

## 📂 Serialized Output Dataset Paths

The processed and engineered sub-datasets have been successfully serialized for model training:

1. **Traffic Prediction**: [traffic_processed.csv](file:///C:/Users/Nikki/SAIOF/ml-engine/data/traffic_processed.csv)
2. **Latency Prediction**: [latency_processed.csv](file:///C:/Users/Nikki/SAIOF/ml-engine/data/latency_processed.csv)
3. **Cache Demand Prediction**: [cache_processed.csv](file:///C:/Users/Nikki/SAIOF/ml-engine/data/cache_processed.csv)

Visual analytics compiled:
* [Correlation Heatmap Matrix](file:///C:/Users/Nikki/SAIOF/ml-engine/data/visualizations/correlation_matrix.png)
* [Feature Importances Spline](file:///C:/Users/Nikki/SAIOF/ml-engine/data/visualizations/feature_importance_latency.png)
* [Diurnal Load Seasonality splines](file:///C:/Users/Nikki/SAIOF/ml-engine/data/visualizations/hourly_load_seasonality.png)
