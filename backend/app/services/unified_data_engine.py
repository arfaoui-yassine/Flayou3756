"""
Unified Data Engine - Combines consumer and product data for comprehensive insights
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import duckdb
import pandas as pd

logger = logging.getLogger(__name__)


class UnifiedDataEngine:
    """
    Unified data engine that combines consumer profiles and product data
    to generate comprehensive marketing insights.
    """

    def __init__(self, consumer_csv_path: Path, product_csv_path: Path | None = None):
        self.consumer_csv_path = consumer_csv_path
        self.product_csv_path = product_csv_path
        self.has_products = False
        
        # Auto-detect purchase data CSVs in data directory
        data_dir = consumer_csv_path.parent
        self.boga_csv_path = data_dir / "achats_boga.csv"
        self.has_boga_data = self.boga_csv_path.exists()
        
        # Test if product CSV can be read
        if product_csv_path and product_csv_path.exists():
            try:
                con = duckdb.connect()
                # Try to read first row to validate CSV
                test_query = f'SELECT * FROM read_csv_auto(?) LIMIT 1'
                con.execute(test_query, [str(product_csv_path)]).df()
                con.close()
                self.has_products = True
                logger.info("Product CSV validated successfully")
            except Exception as e:
                logger.warning(f"Product CSV validation failed: {e}")
                logger.info("System will run in consumer-only mode")
                self.has_products = False
        
        logger.info(f"Unified Data Engine initialized")
        logger.info(f"Consumer data: {consumer_csv_path}")
        logger.info(f"Product data: {product_csv_path} (available: {self.has_products})")
        logger.info(f"Boga purchase data: {self.boga_csv_path} (available: {self.has_boga_data})")

    def get_comprehensive_summary(self, filters: dict[str, str | list[str]] = None) -> dict[str, Any]:
        """
        Get comprehensive summary combining consumer and product data.
        """
        summary = {
            "consumers": self._get_consumer_summary(filters),
            "products": self._get_product_summary(filters) if self.has_products else None,
            "cross_insights": self._get_cross_insights(filters) if self.has_products else None,
        }
        
        # Add product purchase analysis if available and relevant
        if self.has_boga_data:
            product_name = self._detect_product_in_filters(filters)
            if product_name:
                summary["purchase_analysis"] = self.get_product_purchase_analysis(product_name)
        
        return summary
    
    def _detect_product_in_filters(self, filters: dict | None) -> str | None:
        """Detect if filters mention a specific product."""
        if not filters:
            return None
        for key in ['product', 'produit', 'product_name', 'product_category']:
            val = filters.get(key, '')
            if isinstance(val, str) and val:
                return val
        return None

    def _get_consumer_summary(self, filters: dict[str, str | list[str]] = None) -> dict[str, Any]:
        """Get consumer data summary."""
        con = duckdb.connect()
        
        # Build WHERE clause
        where_parts = []
        params = [str(self.consumer_csv_path)]
        
        if filters:
            where_parts, params = self._build_consumer_filters(filters, params)
        
        where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
        
        query = f"""
            SELECT 
                COUNT(*) as total_consumers,
                COUNT(DISTINCT gouvernorat) as unique_regions,
                AVG(age) as avg_age,
                AVG(panier_moyen_tnd) as avg_basket,
                AVG(satisfaction_globale) as avg_satisfaction,
                SUM(CASE WHEN achat_en_ligne = 'True' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as online_purchase_pct,
                COUNT(DISTINCT lifestyle) as lifestyle_types
            FROM read_csv_auto(?)
            {where_sql}
        """
        
        result = con.execute(query, params).df()
        
        # Get top categories
        cat_query = f"""
            SELECT 
                categories_achetees,
                COUNT(*) as count
            FROM read_csv_auto(?)
            {where_sql}
            GROUP BY categories_achetees
            ORDER BY count DESC
            LIMIT 10
        """
        
        top_categories = con.execute(cat_query, params).df()
        
        # Get channel distribution
        channel_query = f"""
            SELECT 
                canaux_utilises,
                COUNT(*) as count
            FROM read_csv_auto(?)
            {where_sql}
            GROUP BY canaux_utilises
            ORDER BY count DESC
            LIMIT 10
        """
        
        channels = con.execute(channel_query, params).df()
        
        con.close()
        
        return {
            "metrics": result.to_dict(orient="records")[0] if len(result) > 0 else {},
            "top_categories": top_categories.to_dict(orient="records"),
            "channel_distribution": channels.to_dict(orient="records"),
        }

    def get_consumer_behavior_data(self, filters: dict[str, str | list[str]] = None) -> dict[str, Any]:
        """
        Generate rich consumer behavior aggregations for charts.
        Works for ANY query — not product-specific.
        Returns demographic, seasonal, channel, satisfaction, and lifestyle breakdowns.
        """
        con = duckdb.connect()
        try:
            con.execute(
                "CREATE TEMP TABLE consumers AS SELECT * FROM read_csv_auto(?)",
                [str(self.consumer_csv_path)]
            )
            
            # Build WHERE clause
            where_parts = []
            if filters:
                fmap = {
                    "governorate": "gouvernorat", "gouvernorat": "gouvernorat",
                    "gender": "genre", "genre": "genre",
                    "age_group": "tranche_age", "age_range": "tranche_age",
                    "region": "region", "milieu": "milieu",
                    "ses": "tranche_revenu",
                }
                for fkey, fval in filters.items():
                    col = fmap.get(fkey)
                    if col and fval:
                        if isinstance(fval, list):
                            placeholders = ", ".join([f"'{v}'" for v in fval])
                            where_parts.append(f"{col} IN ({placeholders})")
                        else:
                            where_parts.append(f"{col} = '{fval}'")
            
            where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
            
            # 1. Age/Gender demographics
            demographics = con.execute(f"""
                SELECT tranche_age, genre, COUNT(*) as nb_consumers,
                       ROUND(AVG(panier_moyen_tnd), 2) as panier_moyen,
                       ROUND(AVG(satisfaction_globale), 2) as satisfaction
                FROM consumers {where_sql}
                GROUP BY tranche_age, genre
                ORDER BY nb_consumers DESC
            """).df().to_dict(orient="records")
            
            # 2. Seasonal activity patterns
            seasonal = con.execute(f"""
                SELECT 
                    'Ramadan' as saison,
                    SUM(CASE WHEN ramadan_actif = 'True' THEN 1 ELSE 0 END) as nb_actifs,
                    ROUND(AVG(CASE WHEN ramadan_actif = 'True' THEN ramadan_panier_tnd ELSE NULL END), 2) as panier_moy
                FROM consumers {where_sql}
                UNION ALL
                SELECT 
                    'Été' as saison,
                    SUM(CASE WHEN ete_actif = 'True' THEN 1 ELSE 0 END),
                    ROUND(AVG(CASE WHEN ete_actif = 'True' THEN ete_panier_tnd ELSE NULL END), 2)
                FROM consumers {where_sql}
                UNION ALL
                SELECT 
                    'Soldes' as saison,
                    SUM(CASE WHEN soldes_actif = 'True' THEN 1 ELSE 0 END),
                    ROUND(AVG(CASE WHEN soldes_actif = 'True' THEN soldes_panier_tnd ELSE NULL END), 2)
                FROM consumers {where_sql}
            """).df().to_dict(orient="records")
            
            # 3. Satisfaction distribution
            satisfaction = con.execute(f"""
                SELECT satisfaction_globale as score, COUNT(*) as nb
                FROM consumers {where_sql}
                GROUP BY satisfaction_globale
                ORDER BY satisfaction_globale
            """).df().to_dict(orient="records")
            
            # 4. Lifestyle breakdown
            lifestyle = con.execute(f"""
                SELECT lifestyle, COUNT(*) as nb,
                       ROUND(AVG(panier_moyen_tnd), 2) as panier_moyen
                FROM consumers {where_sql}
                GROUP BY lifestyle
                ORDER BY nb DESC
            """).df().to_dict(orient="records")
            
            # 5. Payment method distribution
            payment = con.execute(f"""
                SELECT methode_paiement as methode, COUNT(*) as nb
                FROM consumers {where_sql}
                GROUP BY methode_paiement
                ORDER BY nb DESC
            """).df().to_dict(orient="records")
            
            # 6. Region distribution
            regions = con.execute(f"""
                SELECT region, COUNT(*) as nb,
                       ROUND(AVG(panier_moyen_tnd), 2) as panier_moyen
                FROM consumers {where_sql}
                GROUP BY region
                ORDER BY nb DESC
            """).df().to_dict(orient="records")
            
            # 7. Online behavior
            online = con.execute(f"""
                SELECT 
                    SUM(CASE WHEN achat_en_ligne = 'True' THEN 1 ELSE 0 END) as acheteurs_en_ligne,
                    SUM(CASE WHEN achat_en_ligne = 'False' THEN 1 ELSE 0 END) as acheteurs_magasin,
                    ROUND(AVG(recherche_mobile_pct), 1) as recherche_mobile_moy,
                    ROUND(AVG(recherche_duree_jours), 1) as duree_recherche_moy
                FROM consumers {where_sql}
            """).df().iloc[0].to_dict()
            
            friction = con.execute(f"""
                SELECT friction_point, COUNT(*) as nb
                FROM (
                    SELECT unnest(string_split(points_friction, '|')) as friction_point
                    FROM consumers {where_sql}
                )
                GROUP BY friction_point
                ORDER BY nb DESC
                LIMIT 8
            """).df().to_dict(orient="records")
            
            con.close()
            return {
                "demographics": demographics,
                "seasonal": seasonal,
                "satisfaction": satisfaction,
                "lifestyle": lifestyle,
                "payment": payment,
                "regions": regions,
                "online_behavior": online,
                "friction_points": friction,
            }
        except Exception as e:
            logger.error(f"Consumer behavior data failed: {e}")
            con.close()
            return {}

    def _get_product_summary(self, filters: dict[str, str | list[str]] = None) -> dict[str, Any]:
        """Get product data summary. Robust against DuckDB column binding errors."""
        if not self.has_products:
            return None

        con = duckdb.connect()

        try:
            # Load product data into a local table to avoid read_csv_auto binding issues
            con.execute(
                "CREATE TEMPORARY TABLE products AS SELECT * FROM read_csv_auto(?)",
                [str(self.product_csv_path)]
            )

            # Build WHERE clause for products
            where_parts = []
            params = []

            if filters:
                if "season" in filters:
                    season = filters["season"]
                    if season == "ramadan" or (isinstance(season, list) and "ramadan" in season):
                        where_parts.append("ramadan_produit = ?")
                        params.append("Oui")
                    elif season == "ete" or (isinstance(season, list) and "ete" in season):
                        where_parts.append("ete_produit = ?")
                        params.append("Oui")

                if "ses" in filters:
                    ses = filters["ses"]
                    if isinstance(ses, list):
                        if any(s in ["Élevé", "Très élevé"] for s in ses):
                            where_parts.append("prix_segment IN (?, ?)")
                            params.extend(["Premium", "Luxe"])
                    elif ses in ["Élevé", "Très élevé"]:
                        where_parts.append("prix_segment IN (?, ?)")
                        params.extend(["Premium", "Luxe"])

            where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""

            result = con.execute(f"""
                SELECT
                    COUNT(*) as total_products,
                    COUNT(DISTINCT categorie) as unique_categories,
                    AVG(prix_tnd) as avg_price,
                    AVG(avis_moyen) as avg_rating,
                    SUM(CASE WHEN made_in_tunisia = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as made_in_tunisia_pct,
                    SUM(CASE WHEN bio = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as bio_pct,
                    SUM(CASE WHEN tendance_2024 = 'Croissante' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as growing_trend_pct
                FROM products {where_sql}
            """, params).df()

            top_products = con.execute(f"""
                SELECT nom_produit, categorie, prix_tnd, avis_moyen, nb_avis, tendance_2024
                FROM products {where_sql}
                ORDER BY avis_moyen DESC, nb_avis DESC LIMIT 10
            """, params).df()

            categories = con.execute(f"""
                SELECT categorie, COUNT(*) as count, AVG(prix_tnd) as avg_price, AVG(avis_moyen) as avg_rating
                FROM products {where_sql}
                GROUP BY categorie ORDER BY count DESC
            """, params).df()

            con.close()

            return {
                "metrics": result.to_dict(orient="records")[0] if len(result) > 0 else {},
                "top_products": top_products.to_dict(orient="records"),
                "category_breakdown": categories.to_dict(orient="records"),
            }
        except Exception as e:
            logger.warning(f"Product summary failed: {e}")
            con.close()
            return {"metrics": {}, "top_products": [], "category_breakdown": []}

    def _get_cross_insights(self, filters: dict[str, str | list[str]] = None) -> dict[str, Any]:
        """
        Generate cross-insights by matching consumer behavior with product attributes.
        Uses temp tables to avoid DuckDB read_csv_auto binding issues.
        """
        if not self.has_products:
            return None

        con = duckdb.connect()
        insights = []

        try:
            # Load both datasets into temp tables for reliable querying
            con.execute("CREATE TEMPORARY TABLE consumers AS SELECT * FROM read_csv_auto(?)", [str(self.consumer_csv_path)])
            con.execute("CREATE TEMPORARY TABLE products AS SELECT * FROM read_csv_auto(?)", [str(self.product_csv_path)])
        except Exception as e:
            logger.warning(f"Failed to load data for cross-insights: {e}")
            con.close()
            return {"insights": [], "total_opportunities": 0}

        # Ramadan insights
        try:
            ramadan_consumers = con.execute(
                "SELECT COUNT(*) FROM consumers WHERE ramadan_actif = 'True'"
            ).fetchone()[0]

            ramadan_products = con.execute(
                """SELECT nom_produit, categorie, prix_tnd, strategie_marketing
                   FROM products WHERE ramadan_produit = 'Oui'
                   ORDER BY avis_moyen DESC LIMIT 5"""
            ).df()

            insights.append({
                "type": "ramadan_opportunity",
                "consumer_count": int(ramadan_consumers),
                "products": ramadan_products.to_dict(orient="records"),
                "recommendation": f"{ramadan_consumers} consommateurs actifs pendant Ramadan — forte opportunité produits saisonniers"
            })
        except Exception as e:
            logger.warning(f"Ramadan cross-insight failed: {e}")

        # Online shopping insights
        try:
            online_consumers = con.execute(
                "SELECT COUNT(*) FROM consumers WHERE achat_en_ligne = 'True'"
            ).fetchone()[0]

            online_products = con.execute(
                """SELECT nom_produit, categorie, canal_vente_principal, strategie_marketing
                   FROM products
                   WHERE canal_vente_principal IN ('Supermarché', 'En ligne')
                   ORDER BY avis_moyen DESC LIMIT 5"""
            ).df()

            insights.append({
                "type": "online_opportunity",
                "consumer_count": int(online_consumers),
                "products": online_products.to_dict(orient="records"),
                "recommendation": f"{online_consumers} consommateurs achètent en ligne — optimiser les canaux digitaux"
            })
        except Exception as e:
            logger.warning(f"Online cross-insight failed: {e}")

        # Premium segment insights
        try:
            premium_consumers = con.execute(
                "SELECT COUNT(*) FROM consumers WHERE tranche_revenu IN ('Élevé', 'Très élevé')"
            ).fetchone()[0]

            premium_products = con.execute(
                """SELECT nom_produit, categorie, prix_tnd, avantage_competitif
                   FROM products
                   WHERE prix_segment IN ('Premium', 'Luxe')
                   ORDER BY avis_moyen DESC LIMIT 5"""
            ).df()

            insights.append({
                "type": "premium_opportunity",
                "consumer_count": int(premium_consumers),
                "products": premium_products.to_dict(orient="records"),
                "recommendation": f"{premium_consumers} consommateurs à revenu élevé — cibler avec des produits premium"
            })
        except Exception as e:
            logger.warning(f"Premium cross-insight failed: {e}")

        con.close()

        return {
            "insights": insights,
            "total_opportunities": len(insights)
        }

    def _build_consumer_filters(
        self,
        filters: dict[str, str | list[str]],
        params: list
    ) -> tuple[list[str], list]:
        """Build WHERE clause for consumer data."""
        where_parts = []

        filter_mapping = {
            "gouvernorat": "gouvernorat",
            "gender": "genre",
            "genre": "genre",
            "age_range": "tranche_age",
            "ses": "tranche_revenu",
            "milieu": "milieu",
            "season": None,
        }

        for key, value in filters.items():
            if key == "season":
                if value == "ramadan" or (isinstance(value, list) and "ramadan" in value):
                    where_parts.append("ramadan_actif = ?")
                    params.append("True")
                elif value == "ete" or (isinstance(value, list) and "ete" in value):
                    where_parts.append("ete_actif = ?")
                    params.append("True")
                elif value == "soldes" or (isinstance(value, list) and "soldes" in value):
                    where_parts.append("soldes_actif = ?")
                    params.append("True")
            elif key in filter_mapping and filter_mapping[key]:
                col = filter_mapping[key]
                if isinstance(value, list):
                    placeholders = ", ".join(["?"] * len(value))
                    where_parts.append(f"{col} IN ({placeholders})")
                    params.extend(value)
                else:
                    where_parts.append(f"{col} = ?")
                    params.append(value)

        return where_parts, params

    def _build_product_filters(
        self,
        filters: dict[str, str | list[str]],
        params: list
    ) -> tuple[list[str], list]:
        """Build WHERE clause for product data — uses safe unquoted column names."""
        where_parts = []

        if "season" in filters:
            season = filters["season"]
            if season == "ramadan" or (isinstance(season, list) and "ramadan" in season):
                where_parts.append("ramadan_produit = ?")
                params.append("Oui")
            elif season == "ete" or (isinstance(season, list) and "ete" in season):
                where_parts.append("ete_produit = ?")
                params.append("Oui")

        if "ses" in filters:
            ses = filters["ses"]
            if isinstance(ses, list):
                if any(s in ["Élevé", "Très élevé"] for s in ses):
                    where_parts.append("prix_segment IN (?, ?)")
                    params.extend(["Premium", "Luxe"])
            elif ses in ["Élevé", "Très élevé"]:
                where_parts.append("prix_segment IN (?, ?)")
                params.extend(["Premium", "Luxe"])

        return where_parts, params

    def get_product_recommendations(
        self,
        consumer_profile: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """
        Recommend products based on consumer profile.
        Uses robust query that won't crash on column name issues.
        """
        if not self.has_products:
            return []

        con = duckdb.connect()

        try:
            # Simple, robust query: get top-rated products matching price segment
            conditions = []
            params = [str(self.product_csv_path)]

            # Match SES to price segment
            ses = consumer_profile.get("ses", "Moyen")
            if ses in ["Élevé", "Très élevé"]:
                conditions.append("prix_segment IN ('Premium', 'Luxe', 'Moyen')")
            elif ses == "Moyen":
                conditions.append("prix_segment IN ('Moyen', 'Économique')")
            else:
                conditions.append("prix_segment = 'Économique'")

            where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""

            query = f"""
                SELECT
                    nom_produit, categorie, prix_tnd, prix_segment,
                    avis_moyen, strategie_marketing, influenceur_type,
                    canal_vente_principal
                FROM read_csv_auto(?)
                {where_sql}
                ORDER BY avis_moyen DESC, nb_avis DESC
                LIMIT 10
            """

            recommendations = con.execute(query, params).df()
            con.close()
            return recommendations.to_dict(orient="records")
        except Exception as e:
            logger.warning(f"Product recommendations query failed: {e}")
            con.close()
            return []

    def get_product_purchase_analysis(self, product_name: str = "Boga") -> dict[str, Any]:
        """
        Deep analysis of product purchase data from achats_boga.csv.
        Returns rich demographic, seasonal, channel, and competitive insights.
        """
        if not self.has_boga_data:
            return {}
        
        con = duckdb.connect()
        try:
            con.execute(
                "CREATE TEMP TABLE achats AS SELECT * FROM read_csv_auto(?)",
                [str(self.boga_csv_path)]
            )
            
            # Filter to specific product if given
            product_filter = ""
            if product_name and product_name.lower() != "boga":
                product_filter = f"WHERE LOWER(produit) LIKE '%{product_name.lower()}%'"
            
            # 1. Overall metrics
            metrics = con.execute(f"""
                SELECT 
                    COUNT(*) as total_achats,
                    COUNT(DISTINCT produit) as nb_variantes,
                    ROUND(AVG(montant_total), 2) as panier_moyen,
                    ROUND(SUM(montant_total), 2) as ca_total,
                    ROUND(AVG(satisfaction), 2) as satisfaction_moy,
                    SUM(CASE WHEN racheterait = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as taux_rachat_pct,
                    SUM(CASE WHEN recommande_ami = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as taux_recommandation_pct
                FROM achats {product_filter}
            """).df().iloc[0].to_dict()
            
            # 2. Demographics: age distribution
            age_dist = con.execute(f"""
                SELECT tranche_age, genre, COUNT(*) as nb_achats,
                       ROUND(AVG(montant_total), 2) as panier_moyen,
                       ROUND(AVG(satisfaction), 2) as satisfaction
                FROM achats {product_filter}
                GROUP BY tranche_age, genre
                ORDER BY nb_achats DESC
            """).df().to_dict(orient="records")
            
            # 3. Top buyer profile
            top_profile = con.execute(f"""
                SELECT tranche_age, genre, region, canal_achat, occasion,
                       COUNT(*) as nb_achats, ROUND(AVG(quantite), 1) as qte_moy
                FROM achats {product_filter}
                GROUP BY tranche_age, genre, region, canal_achat, occasion
                ORDER BY nb_achats DESC
                LIMIT 5
            """).df().to_dict(orient="records")
            
            # 4. Monthly trend (seasonality)
            monthly = con.execute(f"""
                SELECT mois, COUNT(*) as nb_achats,
                       ROUND(SUM(montant_total), 2) as ca_mensuel,
                       ROUND(AVG(quantite), 1) as qte_moy
                FROM achats {product_filter}
                GROUP BY mois
                ORDER BY CASE mois
                    WHEN 'Janvier' THEN 1 WHEN 'Février' THEN 2 WHEN 'Mars' THEN 3
                    WHEN 'Avril' THEN 4 WHEN 'Mai' THEN 5 WHEN 'Juin' THEN 6
                    WHEN 'Juillet' THEN 7 WHEN 'Août' THEN 8 WHEN 'Septembre' THEN 9
                    WHEN 'Octobre' THEN 10 WHEN 'Novembre' THEN 11 WHEN 'Décembre' THEN 12
                END
            """).df().to_dict(orient="records")
            
            # 5. Channel performance
            channels = con.execute(f"""
                SELECT canal_achat, COUNT(*) as nb_achats,
                       ROUND(AVG(montant_total), 2) as panier_moyen,
                       ROUND(AVG(satisfaction), 2) as satisfaction,
                       SUM(CASE WHEN racheterait = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as taux_rachat
                FROM achats {product_filter}
                GROUP BY canal_achat
                ORDER BY nb_achats DESC
            """).df().to_dict(orient="records")
            
            # 6. Discovery channels (how they found the product)
            discovery = con.execute(f"""
                SELECT canal_decouverte, COUNT(*) as nb,
                       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pct
                FROM achats {product_filter}
                GROUP BY canal_decouverte
                ORDER BY nb DESC
            """).df().to_dict(orient="records")
            
            # 7. Regional distribution
            regions = con.execute(f"""
                SELECT region, gouvernorat, COUNT(*) as nb_achats,
                       ROUND(SUM(montant_total), 2) as ca_total
                FROM achats {product_filter}
                GROUP BY region, gouvernorat
                ORDER BY nb_achats DESC
                LIMIT 10
            """).df().to_dict(orient="records")
            
            # 8. Competitive landscape
            competitors = con.execute(f"""
                SELECT concurrent_essaye, COUNT(*) as nb,
                       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pct
                FROM achats {product_filter}
                WHERE concurrent_essaye != 'Aucun'
                GROUP BY concurrent_essaye
                ORDER BY nb DESC
            """).df().to_dict(orient="records")
            
            # 9. Occasion breakdown
            occasions = con.execute(f"""
                SELECT occasion, COUNT(*) as nb,
                       ROUND(AVG(quantite), 1) as qte_moy,
                       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pct
                FROM achats {product_filter}
                GROUP BY occasion
                ORDER BY nb DESC
            """).df().to_dict(orient="records")
            
            # 10. Product variant breakdown
            variants = con.execute(f"""
                SELECT produit, COUNT(*) as nb_achats,
                       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as part_marche,
                       ROUND(AVG(satisfaction), 2) as satisfaction
                FROM achats
                GROUP BY produit
                ORDER BY nb_achats DESC
            """).df().to_dict(orient="records")
            
            con.close()
            
            return {
                "product_name": product_name,
                "metrics": metrics,
                "demographics": age_dist,
                "top_profiles": top_profile,
                "monthly_trend": monthly,
                "channels": channels,
                "discovery_channels": discovery,
                "regions": regions,
                "competitors": competitors,
                "occasions": occasions,
                "variants": variants,
            }
        except Exception as e:
            logger.error(f"Product purchase analysis failed: {e}")
            con.close()
            return {}
