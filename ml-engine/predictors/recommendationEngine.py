import logging
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("RecommendationEngine")

class RecommendationEngine:
    """
    SAIOF Recommendation Engine
    Analyzes live/predicted telemetry metrics and generates actionable, self-optimizing
    middleware tuning recommendations to protect server bounds and decrease request times.
    """
    def __init__(self):
        # Configuration thresholds
        self.traffic_threshold = 1000  # requests per hour
        self.latency_threshold = 100   # milliseconds
        self.duplicate_threshold = 0.10  # 10% of overall traffic
        self.merge_threshold = 0.05      # 5% coalescing save rate

    def generate_recommendations(
        self,
        predicted_traffic: float,
        predicted_latency: float,
        cache_hit_ratio: float,
        duplicate_rate: float,
        merge_rate: float
    ) -> list:
        """
        Evaluates predictions and metric indicators to compile list of optimizations.
        """
        logger.info(
            f"Evaluating recommendations: Traffic={predicted_traffic:.1f}, "
            f"Latency={predicted_latency:.1f}ms, CacheHit={cache_hit_ratio:.4f}, "
            f"Duplicate={duplicate_rate:.4f}, Merge={merge_rate:.4f}"
        )
        
        recommendations = []

        # 1. Traffic Spike / TTL tuning policy
        if predicted_traffic > self.traffic_threshold:
            recommendations.append("Traffic spike expected. Increase cache TTL.")
        else:
            recommendations.append("Traffic is stable. Maintain default cache TTL.")

        # 2. Latency Bottleneck / Aggressive Cache policy
        if predicted_latency > self.latency_threshold:
            recommendations.append("Enable aggressive cache strategy.")
        else:
            recommendations.append("Latency is stable. Standard cache strategy active.")

        # 3. Request Duplication abuse policy
        if duplicate_rate > self.duplicate_threshold:
            recommendations.append(f"Investigate repeated client requests. Duplicate rate is high ({duplicate_rate * 100:.1f}%).")

        # 4. Request Coalescing (Single Flight) merge check
        if merge_rate < self.merge_threshold:
            recommendations.append(f"Request merging opportunity detected. Merge efficiency under load: {merge_rate * 100:.1f}%.")

        return recommendations

    def get_composite_recommendation(
        self,
        predicted_traffic: float,
        predicted_latency: float,
        cache_hit_ratio: float,
        duplicate_rate: float,
        merge_rate: float
    ) -> str:
        """
        Synthesizes active recommendations into a single, prominent headline recommendation.
        """
        active_recs = self.generate_recommendations(
            predicted_traffic, predicted_latency, cache_hit_ratio, duplicate_rate, merge_rate
        )
        
        # Prioritize issues: Latency -> Traffic -> Duplicates -> Merging -> Health
        if predicted_latency > self.latency_threshold:
            return "CRITICAL: Latency bounds breached. Enable aggressive caching immediately to decrease database execution time."
        if predicted_traffic > self.traffic_threshold:
            return "WARNING: Peak traffic surge forecast. Increase cache TTL values to cushion upstream database queries."
        if duplicate_rate > self.duplicate_threshold:
            return "OPTIMIZATION: Abnormal request duplication detected. Audit client retry loops and enforce strict rate-limits."
        if merge_rate < self.merge_threshold:
            return "ADVISORY: Coalescing savings are low. Request merging opportunity detected on slow read routes."
            
        return "SYSTEM HEALTHY: All telemetry indicators are operating within normal optimal parameters."
