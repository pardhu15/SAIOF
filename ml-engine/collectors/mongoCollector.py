import os
import re
import sys
import logging
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("MongoCollector")

class MongoCollector:
    """
    SAIOF MongoCollector
    Handles connection, collection reads, and prediction history persistence in MongoDB.
    Includes smart fallbacks to handle environments with network/Atlas IP whitelist constraints.
    """
    def __init__(self):
        self.client = None
        self.db = None
        self.connected = False
        self.db_name = "test"
        
        # Load environment variables from the server/.env directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        server_env = os.path.abspath(os.path.join(current_dir, "../../../server/.env"))
        
        logger.info(f"Checking for Express environment at: {server_env}")
        if os.path.exists(server_env):
            load_dotenv(dotenv_path=server_env)
            logger.info("Loaded .env from Express server folder successfully.")
        else:
            load_dotenv()
            logger.warning(".env not found at relative server path, falling back to local shell env.")

        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/saiof")
        logger.info(f"Connecting to MongoDB URI: {self._obfuscate_uri(self.mongo_uri)}")
        
        self.connect()

    def _obfuscate_uri(self, uri: str) -> str:
        """Obfuscates credentials in MongoDB URI for safe logging."""
        try:
            return re.sub(r'mongodb\+srv://([^:]+):([^@]+)@', r'mongodb+srv://\1:******@', uri)
        except Exception:
            return "mongodb://******@host"

    def connect(self):
        """Attempts to establish MongoDB connection with short timeout to prevent blocking."""
        try:
            # Parse connection database from URI path if present
            # Match e.g. mongodb+srv://host/dbname?options
            match = re.search(r"mongodb(?:\+srv)?://[^/]+/([^?#]+)", self.mongo_uri)
            if match:
                self.db_name = match.group(1)
                logger.info(f"Parsed database name '{self.db_name}' from MONGO_URI.")
            
            # Short 3-second selection timeout to fail fast if Atlas firewall/network blocks us
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=3000)
            
            # Trigger database check
            self.client.admin.command('ping')
            
            # If database name not specified, try to list and find the active database
            if self.db_name == "test" or not self.db_name:
                dbs = self.client.list_database_names()
                logger.info(f"Available databases on cluster: {dbs}")
                # Search if there is a database with telemetry collections
                for d in dbs:
                    if d not in ["admin", "config", "local"]:
                        cols = self.client[d].list_collection_names()
                        if "requestlogs" in cols or "trafficmetrics" in cols:
                            self.db_name = d
                            logger.info(f"Auto-selected database '{self.db_name}' containing telemetry.")
                            break
            
            self.db = self.client[self.db_name]
            self.connected = True
            logger.info(f"Successfully connected to MongoDB database: '{self.db_name}'")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            logger.warning("Operating in FALLBACK mode with local synthetic metrics generation.")
            self.connected = False
        except Exception as e:
            logger.error(f"Unexpected database connection error: {e}")
            logger.warning("Operating in FALLBACK mode with local synthetic metrics generation.")
            self.connected = False

    def get_collection_data(self, collection_name: str) -> list:
        """
        Reads all documents from a specific collection.
        Returns a list of dictionaries. Returns an empty list if unconnected or empty.
        """
        if not self.connected or self.db is None:
            logger.debug(f"Collector is offline. Returning empty list for collection: {collection_name}")
            return []
        
        try:
            col = self.db[collection_name]
            docs = list(col.find({}, {"_id": 0}))
            logger.info(f"Retrieved {len(docs)} documents from collection '{collection_name}'")
            return docs
        except Exception as e:
            logger.error(f"Error reading collection '{collection_name}': {e}")
            return []

    def save_prediction_history(self, prediction_type: str, prediction, confidence: float, recommendation: str) -> bool:
        """
        Persists a forecasting prediction record in the 'predictionhistory' collection.
        Saves locally to a JSON file if the database connection is unavailable.
        """
        # Save prediction as float if possible, otherwise string (for categorical cache demand)
        try:
            prediction_val = float(prediction)
        except (ValueError, TypeError):
            prediction_val = str(prediction)

        record = {
            "predictionType": prediction_type,
            "prediction": prediction_val,
            "confidence": float(confidence),
            "recommendation": str(recommendation),
            "timestamp": datetime.utcnow()
        }
        
        if self.connected and self.db is not None:
            try:
                col = self.db["predictionhistory"]
                result = col.insert_one(record)
                logger.info(f"Persisted '{prediction_type}' prediction ({prediction_val}) to DB. ID: {result.inserted_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to persist prediction history in MongoDB: {e}")
        
        # Fallback persistence to local file
        logger.warning(f"Database offline. Writing prediction record locally as fallback.")
        fallback_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../predictionhistory_fallback.jsonl"))
        try:
            import json
            # Serialize datetimes to string
            serializable_record = record.copy()
            serializable_record["timestamp"] = record["timestamp"].isoformat()
            
            with open(fallback_file, "a") as f:
                f.write(json.dumps(serializable_record) + "\n")
            logger.info(f"Successfully wrote prediction to fallback file: {fallback_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to write prediction to fallback file: {e}")
            return False

