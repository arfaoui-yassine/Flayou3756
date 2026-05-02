from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class SegmentationEngine:
    """
    K-means clustering engine for consumer segmentation.
    Automatically determines optimal K using elbow method.
    """

    def __init__(self, max_clusters: int = 6) -> None:
        self.max_clusters = max_clusters
        self.scaler = StandardScaler()

    def _extract_lifestyle_features(self, df: pd.DataFrame) -> pd.DataFrame | None:
        """
        Extract numeric features for clustering.
        Uses available numeric columns from the dataset.
        """
        # Key numeric features for segmentation
        feature_cols = [
            "age",
            "revenu_mensuel_tnd",
            "panier_moyen_tnd",
            "satisfaction_globale",
            "nps",
            "nb_canaux",
            "nb_categories",
            "recherche_mobile_pct",
            "taux_epargne_pct",
        ]
        
        available_cols = [col for col in feature_cols if col in df.columns]
        
        if not available_cols:
            logger.warning("No numeric features available for clustering")
            return None
        
        # Extract and clean features
        features = df[available_cols].copy()
        
        # Handle missing values
        features = features.fillna(features.median())
        
        # Remove rows with any remaining NaN or inf
        features = features.replace([np.inf, -np.inf], np.nan).dropna()
        
        if len(features) < 10:
            logger.warning(f"Insufficient data for clustering: {len(features)} rows")
            return None
        
        return features

    def _find_optimal_k(self, features: pd.DataFrame) -> int:
        """
        Use elbow method to find optimal number of clusters.
        Returns K between 2 and max_clusters.
        """
        if len(features) < 10:
            return 2
        
        max_k = min(self.max_clusters, len(features) // 5)  # At least 5 samples per cluster
        max_k = max(2, max_k)
        
        inertias = []
        k_range = range(2, max_k + 1)
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(features)
            inertias.append(kmeans.inertia_)
        
        # Simple elbow detection: find point with maximum curvature
        if len(inertias) < 2:
            return 2
        
        # Calculate rate of change
        deltas = [inertias[i] - inertias[i + 1] for i in range(len(inertias) - 1)]
        
        # Find elbow (where improvement slows down significantly)
        if len(deltas) > 1:
            delta_deltas = [deltas[i] - deltas[i + 1] for i in range(len(deltas) - 1)]
            optimal_k = delta_deltas.index(max(delta_deltas)) + 2
        else:
            optimal_k = 3  # Default to 3 clusters
        
        logger.info(f"Optimal K determined: {optimal_k} (from range 2-{max_k})")
        return optimal_k

    def segment(self, df: pd.DataFrame) -> dict[str, Any]:
        """
        Perform K-means clustering on the dataset.
        Returns cluster information with centers, sizes, and percentages.
        """
        if len(df) < 10:
            logger.warning("Insufficient data for segmentation")
            return {
                "clusters": [],
                "optimal_k": 0,
                "total_samples": len(df),
                "feature_names": [],
            }
        
        # Extract features
        features = self._extract_lifestyle_features(df)
        
        if features is None or len(features) < 10:
            return {
                "clusters": [],
                "optimal_k": 0,
                "total_samples": len(df),
                "feature_names": [],
            }
        
        # Find optimal K
        optimal_k = self._find_optimal_k(features)
        
        # Scale features
        scaled_features = self.scaler.fit_transform(features)
        
        # Perform K-means
        kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(scaled_features)
        
        # Add cluster labels to original dataframe
        df_with_clusters = df.iloc[features.index].copy()
        df_with_clusters["cluster"] = cluster_labels
        
        # Build cluster information
        clusters = []
        total_samples = len(df_with_clusters)
        
        for cluster_id in range(optimal_k):
            cluster_mask = df_with_clusters["cluster"] == cluster_id
            cluster_data = df_with_clusters[cluster_mask]
            cluster_size = len(cluster_data)
            
            if cluster_size == 0:
                continue
            
            # Calculate cluster center in original scale
            cluster_features = features.iloc[cluster_data.index]
            center = cluster_features.mean().to_dict()
            
            # Get dominant characteristics
            dominant_traits = self._extract_dominant_traits(cluster_data)
            
            clusters.append({
                "id": int(cluster_id),
                "size": int(cluster_size),
                "percentage": round(cluster_size / total_samples * 100, 2),
                "center": {k: round(v, 2) for k, v in center.items()},
                "dominant_traits": dominant_traits,
            })
        
        # Sort by size
        clusters.sort(key=lambda x: x["size"], reverse=True)
        
        return {
            "clusters": clusters,
            "optimal_k": optimal_k,
            "total_samples": total_samples,
            "feature_names": list(features.columns),
        }

    def _extract_dominant_traits(self, cluster_data: pd.DataFrame) -> dict[str, Any]:
        """
        Extract dominant characteristics of a cluster.
        Returns most common values for categorical features.
        """
        traits = {}
        
        # Categorical features to analyze
        categorical_cols = [
            "genre", "tranche_age", "gouvernorat", "milieu", 
            "tranche_revenu", "lifestyle"
        ]
        
        for col in categorical_cols:
            if col in cluster_data.columns:
                mode_value = cluster_data[col].mode()
                if len(mode_value) > 0:
                    traits[col] = str(mode_value.iloc[0])
        
        # Numeric summaries
        if "panier_moyen_tnd" in cluster_data.columns:
            traits["avg_basket"] = round(cluster_data["panier_moyen_tnd"].mean(), 2)
        
        if "satisfaction_globale" in cluster_data.columns:
            traits["avg_satisfaction"] = round(cluster_data["satisfaction_globale"].mean(), 1)
        
        return traits
