"""
Seasonal Analysis Engine for Tunisia B2B Insights
Analyzes consumer behavior changes across seasons (Ramadan, Summer, Sales)
"""

import logging
from pathlib import Path
import duckdb
import pandas as pd

logger = logging.getLogger(__name__)


def analyze_seasonal_behavior(csv_path: Path, filters: dict = None) -> dict:
    """
    Analyze how consumer behavior changes across seasons.
    
    Compares:
    - Ramadan vs Summer vs Sales periods
    - Purchase frequency and basket size
    - Channel preferences
    - Product categories
    
    Returns:
        dict with seasonal insights and comparison data
    """
    try:
        conn = duckdb.connect(":memory:")
        conn.execute(f"CREATE TABLE consumers AS SELECT * FROM read_csv_auto('{csv_path}')")
        
        # Build WHERE clause from filters
        where_clauses = []
        if filters:
            if "gouvernorat" in filters:
                govs = filters["gouvernorat"] if isinstance(filters["gouvernorat"], list) else [filters["gouvernorat"]]
                gov_list = "', '".join(govs)
                where_clauses.append(f"gouvernorat IN ('{gov_list}')")
            if "gender" in filters:
                where_clauses.append(f"genre = '{filters['gender']}'")
            if "age_range" in filters:
                ages = filters["age_range"] if isinstance(filters["age_range"], list) else [filters["age_range"]]
                age_list = "', '".join(ages)
                where_clauses.append(f"tranche_age IN ('{age_list}')")
        
        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        
        # 1. Overall seasonal activity comparison
        seasonal_activity_query = f"""
        SELECT 
            'Ramadan' as season,
            COUNT(*) FILTER (WHERE ramadan_actif = true) as active_consumers,
            ROUND(AVG(ramadan_panier_tnd) FILTER (WHERE ramadan_actif = true), 2) as avg_basket,
            ROUND(COUNT(*) FILTER (WHERE ramadan_actif = true) * 100.0 / COUNT(*), 1) as participation_pct
        FROM consumers
        {where_sql}
        UNION ALL
        SELECT 
            'Été' as season,
            COUNT(*) FILTER (WHERE ete_actif = true) as active_consumers,
            ROUND(AVG(ete_panier_tnd) FILTER (WHERE ete_actif = true), 2) as avg_basket,
            ROUND(COUNT(*) FILTER (WHERE ete_actif = true) * 100.0 / COUNT(*), 1) as participation_pct
        FROM consumers
        {where_sql}
        UNION ALL
        SELECT 
            'Soldes' as season,
            COUNT(*) FILTER (WHERE soldes_actif = true) as active_consumers,
            ROUND(AVG(soldes_panier_tnd) FILTER (WHERE soldes_actif = true), 2) as avg_basket,
            ROUND(COUNT(*) FILTER (WHERE soldes_actif = true) * 100.0 / COUNT(*), 1) as participation_pct
        FROM consumers
        {where_sql}
        ORDER BY active_consumers DESC
        """
        
        seasonal_activity = conn.execute(seasonal_activity_query).fetchdf().to_dict(orient="records")
        
        # 2. Demographic breakdown by season
        demo_query = f"""
        SELECT 
            tranche_age,
            genre,
            COUNT(*) FILTER (WHERE ramadan_actif = true) as ramadan_actifs,
            ROUND(AVG(ramadan_panier_tnd) FILTER (WHERE ramadan_actif = true), 0) as ramadan_panier,
            COUNT(*) FILTER (WHERE ete_actif = true) as ete_actifs,
            ROUND(AVG(ete_panier_tnd) FILTER (WHERE ete_actif = true), 0) as ete_panier,
            COUNT(*) FILTER (WHERE soldes_actif = true) as soldes_actifs,
            ROUND(AVG(soldes_panier_tnd) FILTER (WHERE soldes_actif = true), 0) as soldes_panier
        FROM consumers
        {where_sql}
        GROUP BY tranche_age, genre
        HAVING ramadan_actifs > 0 OR ete_actifs > 0 OR soldes_actifs > 0
        ORDER BY (ramadan_actifs + ete_actifs + soldes_actifs) DESC
        LIMIT 10
        """
        
        demographics = conn.execute(demo_query).fetchdf().to_dict(orient="records")
        
        # 3. Regional preferences
        regional_query = f"""
        SELECT 
            gouvernorat,
            COUNT(*) FILTER (WHERE ramadan_actif = true) as ramadan_actifs,
            COUNT(*) FILTER (WHERE ete_actif = true) as ete_actifs,
            COUNT(*) FILTER (WHERE soldes_actif = true) as soldes_actifs,
            ROUND(AVG(ramadan_panier_tnd) FILTER (WHERE ramadan_actif = true), 0) as ramadan_panier,
            ROUND(AVG(ete_panier_tnd) FILTER (WHERE ete_actif = true), 0) as ete_panier
        FROM consumers
        {where_sql}
        GROUP BY gouvernorat
        HAVING ramadan_actifs > 0 OR ete_actifs > 0
        ORDER BY (ramadan_actifs + ete_actifs) DESC
        LIMIT 8
        """
        
        regional = conn.execute(regional_query).fetchdf().to_dict(orient="records")
        
        # 4. Income level impact
        income_query = f"""
        SELECT 
            tranche_revenu,
            COUNT(*) FILTER (WHERE ramadan_actif = true) as ramadan_actifs,
            ROUND(AVG(ramadan_panier_tnd) FILTER (WHERE ramadan_actif = true), 0) as ramadan_panier,
            COUNT(*) FILTER (WHERE ete_actif = true) as ete_actifs,
            ROUND(AVG(ete_panier_tnd) FILTER (WHERE ete_actif = true), 0) as ete_panier,
            COUNT(*) FILTER (WHERE soldes_actif = true) as soldes_actifs,
            ROUND(AVG(soldes_panier_tnd) FILTER (WHERE soldes_actif = true), 0) as soldes_panier
        FROM consumers
        {where_sql}
        GROUP BY tranche_revenu
        ORDER BY 
            CASE tranche_revenu
                WHEN 'Très élevé' THEN 4
                WHEN 'Élevé' THEN 3
                WHEN 'Moyen' THEN 2
                ELSE 1
            END DESC
        """
        
        income_levels = conn.execute(income_query).fetchdf().to_dict(orient="records")
        
        # 5. Key insights
        total_consumers = conn.execute(f"SELECT COUNT(*) as cnt FROM consumers {where_sql}").fetchone()[0]
        
        ramadan_stats = conn.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE ramadan_actif = true) as actifs,
                ROUND(AVG(ramadan_panier_tnd) FILTER (WHERE ramadan_actif = true), 2) as panier_moy
            FROM consumers {where_sql}
        """).fetchone()
        
        ete_stats = conn.execute(f"""
            SELECT 
                COUNT(*) FILTER (WHERE ete_actif = true) as actifs,
                ROUND(AVG(ete_panier_tnd) FILTER (WHERE ete_actif = true), 2) as panier_moy
            FROM consumers {where_sql}
        """).fetchone()
        
        conn.close()
        
        return {
            "success": True,
            "total_consumers": total_consumers,
            "seasonal_activity": seasonal_activity,
            "demographics": demographics,
            "regional": regional,
            "income_levels": income_levels,
            "key_metrics": {
                "ramadan": {
                    "active_count": ramadan_stats[0],
                    "avg_basket": ramadan_stats[1],
                    "participation_rate": round(ramadan_stats[0] * 100.0 / total_consumers, 1) if total_consumers > 0 else 0
                },
                "summer": {
                    "active_count": ete_stats[0],
                    "avg_basket": ete_stats[1],
                    "participation_rate": round(ete_stats[0] * 100.0 / total_consumers, 1) if total_consumers > 0 else 0
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Seasonal analysis failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "seasonal_activity": [],
            "demographics": [],
            "regional": [],
            "income_levels": []
        }


def format_seasonal_insights(analysis: dict, language: str = "fr") -> str:
    """
    Format seasonal analysis into natural language insights.
    
    Args:
        analysis: Result from analyze_seasonal_behavior()
        language: Output language (fr, darija, en)
    
    Returns:
        Formatted text insights
    """
    if not analysis.get("success"):
        return "Données saisonnières insuffisantes pour l'analyse."
    
    metrics = analysis.get("key_metrics", {})
    ramadan = metrics.get("ramadan", {})
    summer = metrics.get("summer", {})
    
    if language == "darija":
        text = f"""🌙 **Ramadan vs ☀️ Été : كيفاش يتبدل السلوك؟**

في رمضان، {ramadan.get('active_count', 0):,} consommateur ({ramadan.get('participation_rate', 0)}%) يشريو بمعدل {ramadan.get('avg_basket', 0):.0f} TND للشراء.

في الصيف، {summer.get('active_count', 0):,} consommateur ({summer.get('participation_rate', 0)}%) يشريو بمعدل {summer.get('avg_basket', 0):.0f} TND.

**الفرق الكبير:**
"""
    elif language == "en":
        text = f"""🌙 **Ramadan vs ☀️ Summer: Behavioral Changes**

During Ramadan, {ramadan.get('active_count', 0):,} consumers ({ramadan.get('participation_rate', 0)}%) shop with an average basket of {ramadan.get('avg_basket', 0):.0f} TND.

During Summer, {summer.get('active_count', 0):,} consumers ({summer.get('participation_rate', 0)}%) shop with an average basket of {summer.get('avg_basket', 0):.0f} TND.

**Key Differences:**
"""
    else:  # French
        text = f"""🌙 **Ramadan vs ☀️ Été : Comment le comportement change**

Pendant le Ramadan, {ramadan.get('active_count', 0):,} consommateurs ({ramadan.get('participation_rate', 0)}%) achètent avec un panier moyen de {ramadan.get('avg_basket', 0):.0f} TND.

Pendant l'été, {summer.get('active_count', 0):,} consommateurs ({summer.get('participation_rate', 0)}%) achètent avec un panier moyen de {summer.get('avg_basket', 0):.0f} TND.

**Différences clés :**
"""
    
    # Add seasonal activity comparison
    seasonal_activity = analysis.get("seasonal_activity", [])
    if seasonal_activity:
        for season in seasonal_activity:
            text += f"\n- **{season['season']}** : {season['active_consumers']:,} actifs ({season['participation_pct']}%), panier {season['avg_basket']:.0f} TND"
    
    return text
