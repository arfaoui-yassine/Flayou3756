from app.services.predictive_engine import PredictiveEngine
import pandas as pd
import logging
logging.basicConfig(level=logging.INFO)

df = pd.read_csv("c:/Users/dongm/OneDrive/Desktop/projet/data/profils_consommateurs.csv")
engine = PredictiveEngine()
engine.train(df)
print("Training complete and model saved.")
