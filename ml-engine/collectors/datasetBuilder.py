import os
import sys
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collectors.mongoCollector import MongoCollector

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("DatasetBuilder")

class DatasetBuilder:
    """
    SAIOF DatasetBuilder
    Aggregates MongoDB middleware metrics into a time-aligned, hourly aggregated Pandas DataFrame.
    Gracefully generates synthetic historical datasets when database collections are sparse or offline.
    """
    def __init__(self, mongo_collector: MongoCollector = None):
        self.collector = mongo_collector if mongo_collector else MongoCollector()

    def build_dataset(self) -> pd.DataFrame:
        """
        Loads telemetry and compiles it into an hourly-aligned features DataFrame.
        Falls back to generating a seasonal synthetic dataset if insufficient DB data is found.
        """
        logger.info("Initializing dataset build pipeline...")
        
        # Attempt to read all collections from DB
        req_logs = self.collector.get_collection_data("requestlogs")
        traffic_metrics = self.collector.get_collection_data("trafficmetrics")
        cache_metrics = self.collector.get_collection_data("cachemetrics")
        dup_metrics = self.collector.get_collection_data("duplicatemetrics")
        merge_metrics = self.collector.get_collection_data("mergemetrics")

        # Check if we have enough real DB data to build a meaningful timeline (need at least 24 request logs)
        if len(req_logs) < 24:
            logger.warning(f"Insufficient telemetry in database (found {len(req_logs)} logs). Using high-fidelity synthetic builder.")
            return self.generate_synthetic_dataset()

        try:
            # 1. Process Request Logs (Traffic counts + average latencies)
            df_req = pd.DataFrame(req_logs)
            df_req['timestamp'] = pd.to_datetime(df_req['timestamp'])
            df_req['hour_bin'] = df_req['timestamp'].dt.floor('h')
            
            agg_req = df_req.groupby('hour_bin').agg(
                requestCount=('latency', 'count'),
                averageLatency=('latency', 'mean')
            ).reset_index()

            # 2. Process Cache Metrics (Cache hit ratios)
            if len(cache_metrics) > 0:
                df_cache = pd.DataFrame(cache_metrics)
                df_cache['timestamp'] = pd.to_datetime(df_cache['timestamp'])
                df_cache['hour_bin'] = df_cache['timestamp'].dt.floor('h')
                
                # CacheHitRatio = hits / (hits + misses)
                # Map cacheHit/cacheMiss boolean strings or values to floats
                df_cache['hit_val'] = df_cache['cacheHit'].astype(float)
                agg_cache = df_cache.groupby('hour_bin')['hit_val'].mean().reset_index()
                agg_cache.rename(columns={'hit_val': 'cacheHitRatio'}, inplace=True)
            else:
                agg_cache = pd.DataFrame(columns=['hour_bin', 'cacheHitRatio'])

            # 3. Process Duplicate Metrics (Duplicate rates)
            if len(dup_metrics) > 0:
                df_dup = pd.DataFrame(dup_metrics)
                df_dup['timestamp'] = pd.to_datetime(df_dup['timestamp'])
                df_dup['hour_bin'] = df_dup['timestamp'].dt.floor('h')
                
                agg_dup = df_dup.groupby('hour_bin')['count'].sum().reset_index()
                agg_dup.rename(columns={'count': 'duplicateCount'}, inplace=True)
            else:
                agg_dup = pd.DataFrame(columns=['hour_bin', 'duplicateCount'])

            # 4. Process Merge Metrics (Merge rates)
            if len(merge_metrics) > 0:
                df_merge = pd.DataFrame(merge_metrics)
                df_merge['timestamp'] = pd.to_datetime(df_merge['timestamp'])
                df_merge['hour_bin'] = df_merge['timestamp'].dt.floor('h')
                
                agg_merge = df_merge.groupby('hour_bin')['mergedCount'].sum().reset_index()
            else:
                agg_merge = pd.DataFrame(columns=['hour_bin', 'mergedCount'])

            # Merge all aggregates on hour_bin
            df_all = agg_req
            
            # Left join cache
            if not agg_cache.empty:
                df_all = pd.merge(df_all, agg_cache, on='hour_bin', how='left')
            else:
                df_all['cacheHitRatio'] = 0.8  # default baseline
                
            # Left join duplicates
            if not agg_dup.empty:
                df_all = pd.merge(df_all, agg_dup, on='hour_bin', how='left')
                df_all['duplicateCount'] = df_all['duplicateCount'].fillna(0)
                # duplicateRate = duplicateCount / total requests (clip to 1.0)
                df_all['duplicateRate'] = (df_all['duplicateCount'] / df_all['requestCount']).clip(0, 1)
            else:
                df_all['duplicateRate'] = 0.05  # default baseline
                
            # Left join merges
            if not agg_merge.empty:
                df_all = pd.merge(df_all, agg_merge, on='hour_bin', how='left')
                df_all['mergedCount'] = df_all['mergedCount'].fillna(0)
                # mergeRate = mergedCount / total requests
                df_all['mergeRate'] = (df_all['mergedCount'] / df_all['requestCount']).clip(0, 1)
            else:
                df_all['mergeRate'] = 0.02  # default baseline

            # Fill missing entries
            df_all['cacheHitRatio'] = df_all['cacheHitRatio'].fillna(0.8)
            df_all['duplicateRate'] = df_all['duplicateRate'].fillna(0.05)
            df_all['mergeRate'] = df_all['mergeRate'].fillna(0.02)
            
            # Set temporal feature values
            df_all['hour'] = df_all['hour_bin'].dt.hour
            df_all['day'] = df_all['hour_bin'].dt.dayofweek # 0 = Monday, 6 = Sunday

            # Sort chronological
            df_all = df_all.sort_values('hour_bin').reset_index(drop=True)
            
            # Select final features
            features = ['hour_bin', 'hour', 'day', 'requestCount', 'averageLatency', 'cacheHitRatio', 'duplicateRate', 'mergeRate']
            df_final = df_all[features]
            
            logger.info(f"Compiled database dataset. Shapes: {df_final.shape}")
            return df_final
            
        except Exception as e:
            logger.error(f"Error occurred while parsing telemetry collections: {e}")
            logger.warning("Falling back to synthetic historical telemetry compiler.")
            return self.generate_synthetic_dataset()

    def generate_synthetic_dataset(self, days=14) -> pd.DataFrame:
        """
        Generates high-fidelity hourly synthetic telemetry reflecting server seasonal loads, 
        concurrency lag amplification, cache degradation, and traffic fluctuations.
        """
        logger.info(f"Generating synthetic training history for {days} days...")
        
        # End today, go back 'days' days
        end_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(days=days)
        
        time_index = pd.date_range(start=start_time, end=end_time, freq='h')
        
        records = []
        
        # Seed for reproducibility of training runs
        np.random.seed(42)
        
        for t in time_index:
            hour = t.hour
            day = t.dayofweek # 0=Monday, 6=Sunday
            
            # 1. Seasonality & Load modeling (Daily peaks at 12:00-14:00 and 19:00-22:00)
            # Use sine/cosine waves combined
            diurnal_wave1 = np.sin(2 * np.pi * (hour - 8) / 24)  # peak at 14:00
            diurnal_wave2 = np.sin(4 * np.pi * (hour - 17) / 24) # peak at 20:00
            
            base_requests = 100 + 40 * diurnal_wave1 + 25 * diurnal_wave2
            
            # Weekend impact (Commerce websites see ~20% traffic surge on Friday evening, Sat, Sun)
            weekend_multiplier = 1.25 if day in [4, 5, 6] else 0.95
            
            # Random noise (Normally distributed)
            noise = np.random.normal(0, 12)
            
            request_count = int(max(10, base_requests * weekend_multiplier + noise))
            
            # 2. Concurrency Latency modeling:
            # Latency swells as traffic approaches queue saturation
            base_latency = 45.0  # base latency in milliseconds
            queuing_delay = 0.25 * (request_count ** 1.15)
            latency_noise = np.random.normal(0, 4)
            avg_latency = float(max(15.0, base_latency + queuing_delay + latency_noise))
            
            # 3. Cache Hit Ratio modeling:
            # Cache effectiveness degrades slightly at peak hours due to product index traversal
            cache_hit_ratio = float(np.clip(0.85 - (request_count / 1200) * 0.15 + np.random.normal(0, 0.03), 0.5, 0.98))
            
            # 4. Duplicate rate modeling:
            # Duplicate rate spikes slightly under load due to client retries
            duplicate_rate = float(np.clip(0.03 + (request_count / 1500) * 0.08 + np.random.normal(0, 0.01), 0.01, 0.25))
            
            # 5. Coalescing (Merge) Rate modeling:
            # Requests merged increases proportionally with concurrent duplicate requests
            merge_rate = float(np.clip(0.01 + (request_count / 1200) * 0.12 + np.random.normal(0, 0.01), 0.0, 0.20))
            
            records.append({
                "hour_bin": t,
                "hour": hour,
                "day": day,
                "requestCount": request_count,
                "averageLatency": avg_latency,
                "cacheHitRatio": cache_hit_ratio,
                "duplicateRate": duplicate_rate,
                "mergeRate": merge_rate
            })
            
        df = pd.DataFrame(records)
        logger.info(f"Successfully compiled {len(df)} seasonal training metrics records.")
        return df

if __name__ == "__main__":
    builder = DatasetBuilder()
    df = builder.build_dataset()
    print(df.head())
