import os
import sys

# Append the current directory to path to resolve local imports cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from trainers.trainTrafficModel import train_traffic_model

if __name__ == "__main__":
    train_traffic_model()
