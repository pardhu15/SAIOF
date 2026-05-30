import os
import sys
import json
import logging
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure parent directory is in path for absolute imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from collectors.datasetBuilder import DatasetBuilder
from trainers.trainTrafficModel import train_traffic_model
from trainers.trainLatencyModel import train_latency_model
from trainers.trainCacheDemandModel import train_cache_model

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ModelEvaluator")

# Resilient plotting setup
try:
    import matplotlib
    matplotlib.use('Agg')  # Headless backend
    import matplotlib.pyplot as plt
    PLOT_AVAILABLE = True
except ImportError:
    PLOT_AVAILABLE = False
    logger.warning("Matplotlib is not installed. Skipping Actual vs Predicted plot rendering.")

class ModelEvaluator:
    """
    SAIOF ML Model Evaluator Suite
    Runs model training, evaluates regression metrics (R2, MAE, RMSE), 
    and outputs diagnostic JSON and convergence spline plots.
    """
    def __init__(self):
        self.base_dir = parent_dir
        self.reports_dir = os.path.join(self.base_dir, "reports")
        os.makedirs(self.reports_dir, exist_ok=True)

    def evaluate_model(self, model, X_test, y_test, model_name: str) -> dict:
        """Computes standard R2, MAE, and RMSE metrics for a trained estimator."""
        y_pred = model.predict(X_test)
        
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        logger.info(f"Evaluation for '{model_name}': R2={r2:.4f}, MAE={mae:.4f}, RMSE={rmse:.4f}")
        return {
            "r2_score": float(round(r2, 4)),
            "mae": float(round(mae, 4)),
            "rmse": float(round(rmse, 4)),
            "test_size": len(y_test),
            "y_actual": [float(val) for val in y_test.values],
            "y_predicted": [float(val) for val in y_pred]
        }

    def generate_fit_chart(self, y_actual, y_predicted, model_name: str):
        """Generates Actual vs. Predicted regression spline chart."""
        if not PLOT_AVAILABLE:
            return

        try:
            plt.figure(figsize=(10, 5))
            
            # Sort actuals chronologically for a clean visual spline
            indices = np.arange(len(y_actual))
            
            plt.plot(indices[:100], y_actual[:100], label='Actual Metric', color='#10b981', linewidth=2, marker='o')
            plt.plot(indices[:100], y_predicted[:100], label='Predicted Forecast', color='#4f46e5', linewidth=1.8, linestyle='--', marker='x')
            
            plt.title(f'Actual vs. Predicted Convergence - {model_name} Model', fontsize=14, pad=15)
            plt.xlabel('Telemetry Observation Sample Index (Test Set)', fontsize=12)
            plt.ylabel('Metric Unit Value', fontsize=12)
            plt.legend(frameon=True, fontsize=11)
            plt.tight_layout()
            
            chart_filename = f"{model_name.lower().replace(' ', '-')}-training-chart.png"
            chart_path = os.path.join(self.reports_dir, chart_filename)
            plt.savefig(chart_path, dpi=150)
            plt.close()
            logger.info(f"Saved Actual vs Predicted chart for '{model_name}' to: {chart_path}")
        except Exception as e:
            logger.error(f"Failed to generate training fit visual for '{model_name}': {e}")

    def run(self):
        logger.info("==================================================")
        logger.info("START - Booting SAIOF ML Model Training & Evaluation Suite")
        logger.info("==================================================")


        # 1. Compile base hourly-aligned telemetry dataset
        builder = DatasetBuilder()
        df = builder.build_dataset()

        # 2. Train models
        logger.info("1/3. Fitting Traffic Model...")
        traffic_model, X_test_t, y_test_t, feats_t = train_traffic_model(df)
        
        logger.info("2/3. Fitting Latency Model...")
        latency_model, X_test_l, y_test_l, feats_l = train_latency_model(df)
        
        logger.info("3/3. Fitting Cache Model...")
        cache_model, X_test_c, y_test_c, feats_c = train_cache_model(df)

        # 3. Evaluate estimators
        logger.info("Evaluating forecasting estimators...")
        eval_t = self.evaluate_model(traffic_model, X_test_t, y_test_t, "Traffic Prediction")
        eval_l = self.evaluate_model(latency_model, X_test_l, y_test_l, "Latency Prediction")
        eval_c = self.evaluate_model(cache_model, X_test_c, y_test_c, "Cache Demand")

        # 4. Save model evaluation JSON report
        eval_report = {
            "trafficModel": {
                "r2_score": eval_t["r2_score"],
                "mae": eval_t["mae"],
                "rmse": eval_t["rmse"]
            },
            "latencyModel": {
                "r2_score": eval_l["r2_score"],
                "mae": eval_l["mae"],
                "rmse": eval_l["rmse"]
            },
            "cacheDemandModel": {
                "r2_score": eval_c["r2_score"],
                "mae": eval_c["mae"],
                "rmse": eval_c["rmse"]
            }
        }
        
        eval_json_path = os.path.join(self.reports_dir, "model-evaluation.json")
        with open(eval_json_path, "w", encoding="utf-8") as f:
            json.dump(eval_report, f, indent=2)
        logger.info(f"Saved evaluations report to: {eval_json_path}")

        # 5. Extract and save Feature Importance JSON report
        logger.info("Extracting feature importances...")
        feat_importance_report = {
            "traffic": dict(sorted(zip(feats_t, [float(x) for x in traffic_model.feature_importances_]), key=lambda x: x[1], reverse=True)),
            "latency": dict(sorted(zip(feats_l, [float(x) for x in latency_model.feature_importances_]), key=lambda x: x[1], reverse=True)),
            "cache": dict(sorted(zip(feats_c, [float(x) for x in cache_model.feature_importances_]), key=lambda x: x[1], reverse=True))
        }
        
        importance_json_path = os.path.join(self.reports_dir, "feature-importance.json")
        with open(importance_json_path, "w", encoding="utf-8") as f:
            json.dump(feat_importance_report, f, indent=2)
        logger.info(f"Saved feature importances report to: {importance_json_path}")

        # 6. Render visualizations
        logger.info("Compiling Actual vs Predicted visuals...")
        self.generate_fit_chart(y_test_t, eval_t["y_predicted"], "Traffic")
        self.generate_fit_chart(y_test_l, eval_l["y_predicted"], "Latency")
        self.generate_fit_chart(y_test_c, eval_c["y_predicted"], "Cache")

        logger.info("==================================================")
        logger.info("SUCCESS - Model Training & Evaluations Pipeline Finished successfully!")
        logger.info("==================================================")


if __name__ == "__main__":
    evaluator = ModelEvaluator()
    evaluator.run()
