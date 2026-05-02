from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

logger = logging.getLogger(__name__)


class PredictiveEngine:
    """
    XGBoost-based predictive engine for channel recommendation.
    Predicts optimal purchase channel based on consumer characteristics.
    """

    def __init__(self, model_path: Path | None = None) -> None:
        self.model_path = model_path or Path("backend/models/channel_predictor.pkl")
        self.model: xgb.XGBClassifier | None = None
        self.label_encoder = LabelEncoder()
        self.feature_encoders: dict[str, LabelEncoder] = {}
        self.feature_names: list[str] = []
        self.is_trained = False

    def _prepare_features(self, df: pd.DataFrame, fit: bool = False) -> pd.DataFrame | None:
        """
        Prepare features for training or prediction.
        Encodes categorical variables and selects relevant features.
        """
        # Define feature columns
        numeric_features = [
            "age", "revenu_mensuel_tnd", "panier_moyen_tnd", 
            "satisfaction_globale", "nb_canaux", "nb_categories",
            "recherche_mobile_pct", "taux_epargne_pct"
        ]
        
        categorical_features = [
            "genre", "tranche_age", "gouvernorat", "milieu", 
            "tranche_revenu", "lifestyle"
        ]
        
        # Check available features
        available_numeric = [f for f in numeric_features if f in df.columns]
        available_categorical = [f for f in categorical_features if f in df.columns]
        
        if not available_numeric and not available_categorical:
            logger.warning("No features available for prediction")
            return None
        
        features_df = pd.DataFrame()
        
        # Add numeric features
        for feat in available_numeric:
            features_df[feat] = df[feat].fillna(df[feat].median())
        
        # Encode categorical features
        for feat in available_categorical:
            if fit:
                # Fit new encoder
                self.feature_encoders[feat] = LabelEncoder()
                features_df[feat] = self.feature_encoders[feat].fit_transform(
                    df[feat].fillna("Unknown").astype(str)
                )
            else:
                # Use existing encoder
                if feat in self.feature_encoders:
                    # Handle unseen categories
                    values = df[feat].fillna("Unknown").astype(str)
                    known_classes = set(self.feature_encoders[feat].classes_)
                    values = values.apply(lambda x: x if x in known_classes else "Unknown")
                    features_df[feat] = self.feature_encoders[feat].transform(values)
                else:
                    # Skip if encoder not available
                    continue
        
        if fit:
            self.feature_names = list(features_df.columns)
        else:
            # Ensure columns are exactly the same order as trained
            if hasattr(self, 'feature_names') and self.feature_names:
                for col in self.feature_names:
                    if col not in features_df.columns:
                        features_df[col] = 0
                features_df = features_df[self.feature_names]
        
        return features_df

    def _extract_primary_channel(self, channel_str: str) -> str:
        """
        Extract primary channel from pipe-separated channel string.
        Maps to simplified channel categories.
        """
        if pd.isna(channel_str) or not isinstance(channel_str, str):
            return "unknown"
        
        channels = channel_str.lower().split("|")
        
        # Priority mapping
        if any("app_mobile" in c or "site_ecommerce" in c for c in channels):
            return "online"
        elif any("reseaux_sociaux" in c for c in channels):
            return "social_media"
        elif any("whatsapp" in c for c in channels):
            return "whatsapp"
        elif any("marche_souk" in c for c in channels):
            return "souk"
        elif any("boutique" in c for c in channels):
            return "physical"
        else:
            return "mixed"

    def train(self, df: pd.DataFrame) -> dict[str, Any]:
        """
        Train XGBoost model on the full dataset.
        Predicts primary purchase channel based on consumer features.
        """
        if len(df) < 50:
            logger.warning("Insufficient data for training")
            return {"success": False, "reason": "insufficient_data"}
        
        # Extract target variable
        if "canaux_utilises" not in df.columns:
            logger.error("Target column 'canaux_utilises' not found")
            return {"success": False, "reason": "missing_target"}
        
        df["primary_channel"] = df["canaux_utilises"].apply(self._extract_primary_channel)
        
        # Remove unknown channels
        df_clean = df[df["primary_channel"] != "unknown"].copy()
        
        if len(df_clean) < 50:
            logger.warning("Insufficient clean data for training")
            return {"success": False, "reason": "insufficient_clean_data"}
        
        # Prepare features
        X = self._prepare_features(df_clean, fit=True)
        
        if X is None or len(X) < 50:
            return {"success": False, "reason": "feature_preparation_failed"}
        
        # Encode target
        y = self.label_encoder.fit_transform(df_clean["primary_channel"])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train XGBoost
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            eval_metric="mlogloss"
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        self.is_trained = True
        
        # Save model
        self._save_model()
        
        logger.info(f"Model trained: train_acc={train_score:.3f}, test_acc={test_score:.3f}")
        
        return {
            "success": True,
            "train_accuracy": round(train_score, 3),
            "test_accuracy": round(test_score, 3),
            "n_samples": len(df_clean),
            "n_features": len(self.feature_names),
            "classes": list(self.label_encoder.classes_),
        }

    def predict_channel(self, sample_data: pd.DataFrame) -> dict[str, Any]:
        """
        Predict optimal channel for given consumer profile(s).
        Returns probabilities and recommendations.
        """
        if not self.is_trained and not self._load_model():
            return {
                "success": False,
                "reason": "model_not_trained",
                "recommended_channel": "social_media",  # Default fallback
                "confidence": 0.5,
                "probabilities": {},
            }
        
        # Prepare features
        X = self._prepare_features(sample_data, fit=False)
        
        if X is None or len(X) == 0:
            return {
                "success": False,
                "reason": "feature_preparation_failed",
                "recommended_channel": "social_media",
                "confidence": 0.5,
                "probabilities": {},
            }
        
        # Predict probabilities
        proba = self.model.predict_proba(X)
        predictions = self.model.predict(X)
        
        # Get results for first sample
        pred_label = self.label_encoder.inverse_transform([predictions[0]])[0]
        pred_proba = proba[0]
        
        # Build probability dict
        prob_dict = {
            self.label_encoder.inverse_transform([i])[0]: round(float(p), 3)
            for i, p in enumerate(pred_proba)
        }
        
        # Sort by probability
        sorted_channels = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
        
        confidence = float(pred_proba.max())
        
        # Get alternative channels
        alternatives = [ch for ch, prob in sorted_channels[1:4] if prob > 0.1]
        
        return {
            "success": True,
            "recommended_channel": pred_label,
            "confidence": round(confidence, 3),
            "probabilities": prob_dict,
            "alternative_channels": alternatives,
            "high_confidence": confidence > 0.7,
        }

    def _save_model(self) -> None:
        """Save trained model to disk."""
        try:
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            
            model_data = {
                "model": self.model,
                "label_encoder": self.label_encoder,
                "feature_encoders": self.feature_encoders,
                "feature_names": self.feature_names,
            }
            
            with open(self.model_path, "wb") as f:
                pickle.dump(model_data, f)
            
            logger.info(f"Model saved to {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")

    def _load_model(self) -> bool:
        """Load trained model from disk."""
        try:
            if not self.model_path.exists():
                logger.warning(f"Model file not found: {self.model_path}")
                return False
            
            with open(self.model_path, "rb") as f:
                model_data = pickle.load(f)
            
            self.model = model_data["model"]
            self.label_encoder = model_data["label_encoder"]
            self.feature_encoders = model_data["feature_encoders"]
            self.feature_names = model_data["feature_names"]
            self.is_trained = True
            
            logger.info(f"Model loaded from {self.model_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
