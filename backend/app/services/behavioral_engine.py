"""
Behavioral Curve Engine - Generates monthly consumer behavior data
by synthesizing seasonal patterns from consumer and product data.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import duckdb

logger = logging.getLogger(__name__)

# Tunisian seasonal calendar with approximate month mappings
SEASONAL_CALENDAR = {
    "Janvier":   {"season": "hiver", "events": ["Soldes d'hiver"], "ramadan_2024": False},
    "Février":   {"season": "hiver", "events": [], "ramadan_2024": False},
    "Mars":      {"season": "printemps", "events": ["Début Ramadan 2024"], "ramadan_2024": True},
    "Avril":     {"season": "printemps", "events": ["Ramadan", "Aïd el-Fitr"], "ramadan_2024": True},
    "Mai":       {"season": "printemps", "events": ["Post-Aïd", "Préparation été"], "ramadan_2024": False},
    "Juin":      {"season": "ete", "events": ["Début Soldes d'été", "Aïd el-Adha"], "ramadan_2024": False},
    "Juillet":   {"season": "ete", "events": ["Vacances", "Pic touristique"], "ramadan_2024": False},
    "Août":      {"season": "ete", "events": ["Vacances", "Mariages"], "ramadan_2024": False},
    "Septembre": {"season": "automne", "events": ["Rentrée scolaire"], "ramadan_2024": False},
    "Octobre":   {"season": "automne", "events": ["Rentrée universitaire"], "ramadan_2024": False},
    "Novembre":  {"season": "automne", "events": ["Black Friday TN"], "ramadan_2024": False},
    "Décembre":  {"season": "hiver", "events": ["Fin d'année", "Soldes d'hiver"], "ramadan_2024": False},
}

MONTHS = list(SEASONAL_CALENDAR.keys())


def generate_behavioral_curve(
    consumer_csv: Path,
    product_csv: Path | None = None,
    filters: dict[str, Any] | None = None,
    product_name: str | None = None,
) -> dict[str, Any]:
    """
    Generate monthly consumer behavior data synthesized from seasonal indicators.
    
    Returns a dict with:
    - monthly_data: list of {month, panier_moyen, taux_achat, indice_activite, events, is_peak, is_transition}
    - transition_periods: detected periods where behavior shifts significantly
    - peak_periods: months with highest activity
    - insights: textual summary of behavioral patterns
    """
    con = duckdb.connect()
    
    try:
        con.execute(
            "CREATE TEMP TABLE consumers AS SELECT * FROM read_csv_auto(?)",
            [str(consumer_csv)]
        )
        
        # Base consumer metrics
        base = con.execute("""
            SELECT 
                AVG(panier_moyen_tnd) as avg_basket,
                AVG(CAST(ramadan_panier_tnd AS DOUBLE)) as avg_ramadan_basket,
                AVG(CAST(ete_panier_tnd AS DOUBLE)) as avg_ete_basket,
                AVG(CAST(soldes_panier_tnd AS DOUBLE)) as avg_soldes_basket,
                SUM(CASE WHEN ramadan_actif = 'True' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_ramadan,
                SUM(CASE WHEN ete_actif = 'True' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_ete,
                SUM(CASE WHEN soldes_actif = 'True' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_soldes,
                SUM(CASE WHEN achat_en_ligne = 'True' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_online,
                COUNT(*) as total
            FROM consumers
        """).df().iloc[0].to_dict()
        
        # Channel usage breakdown
        channels = con.execute("""
            SELECT 
                SUM(CASE WHEN canaux_utilises LIKE '%app_mobile%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_mobile,
                SUM(CASE WHEN canaux_utilises LIKE '%boutique_physique%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_physical,
                SUM(CASE WHEN canaux_utilises LIKE '%reseaux_sociaux%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_social,
                SUM(CASE WHEN canaux_utilises LIKE '%marche_souk%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_souk
            FROM consumers
        """).df().iloc[0].to_dict()
        
        # Product seasonality data
        product_seasons = {}
        if product_csv and product_csv.exists():
            try:
                con.execute(
                    "CREATE TEMP TABLE products AS SELECT * FROM read_csv_auto(?)",
                    [str(product_csv)]
                )
                
                # If specific product requested, get its seasonality
                if product_name:
                    prod = con.execute("""
                        SELECT saison_forte, saison_faible, 
                               ramadan_produit, ete_produit, hiver_produit, aid_produit, mariage_produit,
                               nom_produit, categorie, prix_tnd
                        FROM products 
                        WHERE LOWER(nom_produit) LIKE ?
                        LIMIT 1
                    """, [f"%{product_name.lower()}%"]).df()
                    
                    if len(prod) > 0:
                        product_seasons = prod.iloc[0].to_dict()
                
                # Get aggregate product seasonality
                prod_agg = con.execute("""
                    SELECT 
                        SUM(CASE WHEN ramadan_produit = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_ramadan_prod,
                        SUM(CASE WHEN ete_produit = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_ete_prod,
                        SUM(CASE WHEN hiver_produit = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_hiver_prod,
                        SUM(CASE WHEN aid_produit = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_aid_prod,
                        SUM(CASE WHEN mariage_produit = 'Oui' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pct_mariage_prod
                    FROM products
                """).df().iloc[0].to_dict()
                product_seasons["aggregate"] = prod_agg
            except Exception as e:
                logger.warning(f"Product seasonality query failed: {e}")
        
        con.close()
        
        # --- Synthesize monthly behavior ---
        avg_basket = float(base.get("avg_basket", 150))
        ramadan_basket = float(base.get("avg_ramadan_basket", avg_basket * 1.4))
        ete_basket = float(base.get("avg_ete_basket", avg_basket * 1.1))
        soldes_basket = float(base.get("avg_soldes_basket", avg_basket * 1.3))
        
        pct_ramadan = float(base.get("pct_ramadan", 60))
        pct_ete = float(base.get("pct_ete", 40))
        pct_soldes = float(base.get("pct_soldes", 50))
        
        # Monthly multipliers based on Tunisian consumer behavior patterns
        month_multipliers = {
            "Janvier":   {"basket": 0.85, "activity": 0.75, "online": 0.80, "physical": 0.90},  # Post-fêtes, froid
            "Février":   {"basket": 0.80, "activity": 0.70, "online": 0.85, "physical": 0.85},  # Creux
            "Mars":      {"basket": 1.35, "activity": 1.30, "online": 1.10, "physical": 1.40},  # Ramadan début
            "Avril":     {"basket": 1.50, "activity": 1.45, "online": 1.20, "physical": 1.60},  # Ramadan + Aïd
            "Mai":       {"basket": 0.95, "activity": 0.90, "online": 0.95, "physical": 0.90},  # Post-Aïd
            "Juin":      {"basket": 1.15, "activity": 1.10, "online": 1.15, "physical": 1.05},  # Soldes été + Aïd Adha
            "Juillet":   {"basket": 1.20, "activity": 1.15, "online": 1.25, "physical": 1.00},  # Vacances
            "Août":      {"basket": 1.25, "activity": 1.10, "online": 1.10, "physical": 1.15},  # Mariages
            "Septembre": {"basket": 1.30, "activity": 1.25, "online": 1.30, "physical": 1.20},  # Rentrée
            "Octobre":   {"basket": 1.00, "activity": 0.95, "online": 1.00, "physical": 0.95},  # Normal
            "Novembre":  {"basket": 1.10, "activity": 1.05, "online": 1.35, "physical": 0.85},  # Black Friday
            "Décembre":  {"basket": 1.05, "activity": 0.95, "online": 1.10, "physical": 0.95},  # Fin d'année
        }
        
        monthly_data = []
        prev_activity = None
        
        for month in MONTHS:
            cal = SEASONAL_CALENDAR[month]
            mult = month_multipliers[month]
            
            panier = round(avg_basket * mult["basket"], 2)
            activity_index = round(mult["activity"] * 100, 1)
            online_index = round(mult["online"] * float(base.get("pct_online", 40)), 1)
            physical_index = round(mult["physical"] * float(channels.get("pct_physical", 50)), 1)
            
            # Adjust for Ramadan if consumer data shows strong Ramadan activity
            if cal.get("ramadan_2024") and pct_ramadan > 50:
                panier = round(ramadan_basket * mult["basket"], 2)
                activity_index = round(activity_index * 1.15, 1)
            
            # Detect transition (>15% change from previous month)
            is_transition = False
            transition_direction = None
            if prev_activity is not None:
                change = ((activity_index - prev_activity) / prev_activity) * 100
                if abs(change) > 15:
                    is_transition = True
                    transition_direction = "hausse" if change > 0 else "baisse"
            
            is_peak = activity_index >= 120
            
            monthly_data.append({
                "month": month,
                "panier_moyen": panier,
                "indice_activite": activity_index,
                "taux_online": min(online_index, 100),
                "taux_physique": min(physical_index, 100),
                "events": cal["events"],
                "season": cal["season"],
                "is_peak": is_peak,
                "is_transition": is_transition,
                "transition_direction": transition_direction,
            })
            
            prev_activity = activity_index
        
        # Detect transitions
        transitions = [m for m in monthly_data if m["is_transition"]]
        peaks = [m for m in monthly_data if m["is_peak"]]
        
        # Build product overlay if specific product
        product_overlay = None
        if product_seasons and "nom_produit" in product_seasons:
            saison_forte = str(product_seasons.get("saison_forte", ""))
            saison_faible = str(product_seasons.get("saison_faible", ""))
            
            product_overlay = {
                "nom_produit": product_seasons.get("nom_produit", ""),
                "categorie": product_seasons.get("categorie", ""),
                "prix_tnd": product_seasons.get("prix_tnd", 0),
                "monthly_relevance": []
            }
            
            for m in monthly_data:
                relevance = 50  # Base
                season = m["season"]
                
                if saison_forte.lower() in ["toute année", "toute annee"]:
                    relevance = 75
                elif season == "hiver" and "hiver" in saison_forte.lower():
                    relevance = 95
                elif season == "ete" and ("été" in saison_forte.lower() or "ete" in saison_forte.lower()):
                    relevance = 95
                elif season == "printemps" and "ramadan" in saison_forte.lower():
                    relevance = 90
                
                # Boost for specific product flags
                if m["month"] in ["Mars", "Avril"] and str(product_seasons.get("ramadan_produit")) == "Oui":
                    relevance = min(relevance + 30, 100)
                if m["month"] in ["Juillet", "Août"] and str(product_seasons.get("ete_produit")) == "Oui":
                    relevance = min(relevance + 25, 100)
                if m["month"] in ["Décembre", "Janvier"] and str(product_seasons.get("hiver_produit")) == "Oui":
                    relevance = min(relevance + 20, 100)
                if m["month"] in ["Août"] and str(product_seasons.get("mariage_produit")) == "Oui":
                    relevance = min(relevance + 20, 100)
                
                # Decrease for weak season
                if saison_faible.lower() in season:
                    relevance = max(relevance - 25, 10)
                
                product_overlay["monthly_relevance"].append({
                    "month": m["month"],
                    "relevance": relevance
                })
        
        return {
            "monthly_data": monthly_data,
            "transitions": [
                {
                    "month": t["month"],
                    "direction": t["transition_direction"],
                    "events": t["events"],
                }
                for t in transitions
            ],
            "peaks": [{"month": p["month"], "indice": p["indice_activite"], "events": p["events"]} for p in peaks],
            "summary": {
                "avg_basket": round(avg_basket, 2),
                "total_consumers": int(base.get("total", 0)),
                "pct_ramadan_active": round(pct_ramadan, 1),
                "pct_ete_active": round(pct_ete, 1),
                "pct_soldes_active": round(pct_soldes, 1),
                "strongest_month": max(monthly_data, key=lambda x: x["indice_activite"])["month"],
                "weakest_month": min(monthly_data, key=lambda x: x["indice_activite"])["month"],
            },
            "product_overlay": product_overlay,
        }
    except Exception as e:
        logger.error(f"Behavioral curve generation failed: {e}")
        con.close()
        return {"monthly_data": [], "transitions": [], "peaks": [], "summary": {}, "product_overlay": None}
