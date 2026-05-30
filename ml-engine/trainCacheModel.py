import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from trainers.trainCacheModel import train_cache_model

if __name__ == "__main__":
    train_cache_model()
