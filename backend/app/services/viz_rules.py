from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Known product names for product-specific query detection
# ============================================================================
PRODUCT_KEYWORDS = {
    "boga": ["Boga Cidre", "Boga Limoun"],
    "gazoz": ["Boga Cidre", "Boga Limoun"],
    "cidre": ["Boga Cidre"],
    "limoun": ["Boga Limoun"],
    "harissa": ["Harissa Cap Bon Forte"],
    "dattes": ["Dattes Deglet Nour Premium"],
    "deglet": ["Dattes Deglet Nour Premium"],
    "makroud": ["Makroud aux Dattes"],
    "huile": ["Huile d'Olive Extra Vierge Chetoui"],
    "chetoui": ["Huile d'Olive Extra Vierge Chetoui"],
    "couscous": ["Couscous Grain Moyen"],
    "thon": ["Thon à l'Huile d'Olive"],
    "savon": ["Savon Noir Beldi"],
    "henné": ["Henné Naturel"],
    "parfum": ["Parfum Musc Tunisien"],
    "brick": ["Brick à l'Oeuf Surgelé"],
    "tapis": ["Tapis Berbère Artisanal"],
    "lait": ["Lait Frais Pasteurisé"],
    "chéchia": ["Chéchia Traditionnelle"],
    "slata": ["Slata Mechouia en Conserve"],
    "mechouia": ["Slata Mechouia en Conserve"],
    "fromage": ["Fromage Double Crème"],
    "solaire": ["Crème Solaire Protectrice"],
}


def detect_product_query(question: str) -> list[str]:
    """Detect if the question mentions specific products."""
    q = question.lower()
    matched = []
    for keyword, products in PRODUCT_KEYWORDS.items():
        if keyword in q:
            for p in products:
                if p not in matched:
                    matched.append(p)
    return matched


def choose_chart_type(question: str, records_count: int, dimension_key: str = "") -> tuple[str, str]:
    """
    Choose the most appropriate chart type based on the question and data characteristics.
    
    Args:
        question: The user's question
        records_count: Number of data points
        dimension_key: The dimension being analyzed (e.g., 'gouvernorat', 'age_range')
    
    Returns:
        Tuple of (chart_type, reasoning)
    """
    q = question.lower()
    
    # 1. Temporal/Sequential data → Line chart
    if any(token in q for token in ["trend", "évolution", "evolution", "time", "temps", "month", "mois", "année", "year", "courbe", "tendance"]):
        return "line", "Courbe d'évolution temporelle pour visualiser les tendances"
    
    # 2. Distribution/Share analysis → Pie chart (only if ≤6 items)
    if any(token in q for token in ["répartition", "distribution", "part", "share", "%", "pourcentage", "proportion"]):
        if records_count <= 6:
            return "pie", "Graphique circulaire pour montrer les proportions"
        else:
            return "bar", "Graphique en barres (trop d'éléments pour un graphique circulaire)"
    
    # 3. Comparison between groups → Bar chart
    if any(token in q for token in ["compare", "comparer", "comparaison", "vs", "versus", "entre", "différence", "فرق", "مقارنة"]):
        return "bar", "Graphique en barres pour comparer les groupes"
    
    # 4. Geographic analysis → Bar chart (sorted by value)
    if any(token in q for token in ["région", "region", "gouvernorat", "ville", "city", "géographique", "geographic"]) or dimension_key == "gouvernorat":
        return "bar", "Graphique en barres pour l'analyse géographique"
    
    # 5. Age/Demographic analysis → Bar chart
    if any(token in q for token in ["âge", "age", "tranche", "génération", "generation", "démographique", "demographic"]) or dimension_key in ["tranche_age", "age_range"]:
        return "bar", "Graphique en barres pour l'analyse démographique"
    
    # 6. Channel analysis → Bar chart (horizontal for better readability)
    if any(token in q for token in ["canal", "channel", "canaux", "channels", "achat", "purchase"]) or dimension_key in ["canal_prefere", "purchase_channel"]:
        return "bar", "Graphique en barres pour comparer les canaux"
    
    # 7. Multi-dimensional profile → Radar chart (only if 4+ dimensions)
    if any(token in q for token in ["profil", "profile", "segment", "persona", "caractéristique", "characteristic", "radar"]):
        if records_count >= 4:
            return "radar", "Graphique radar pour visualiser le profil multi-dimensionnel"
        else:
            return "bar", "Graphique en barres (pas assez de dimensions pour un radar)"
    
    # 8. Correlation/Scatter → Scatter chart
    if any(token in q for token in ["corrélation", "correlation", "relation", "scatter", "nuage"]):
        return "scatter", "Nuage de points pour visualiser les corrélations"
    
    # 9. Many items (>15) → Line chart for better readability
    if records_count > 15:
        return "line", "Graphique en ligne pour une meilleure lisibilité avec beaucoup de données"
    
    # 10. Few items (≤6) → Pie chart works well
    if records_count <= 6:
        return "pie", "Graphique circulaire adapté pour peu d'éléments"
    
    # 11. Default → Bar chart (most versatile)
    return "bar", "Graphique en barres pour une comparaison claire"


def choose_secondary_chart_type(
    primary_type: str, 
    question: str, 
    records_count: int, 
    dimension_key: str = ""
) -> tuple[str, str] | None:
    """
    Choose a complementary secondary chart type to pair with the primary chart.
    Returns None if no secondary chart is beneficial.
    """
    q = question.lower()
    
    # If primary is bar → secondary could be pie (distribution view) or line (trend)
    if primary_type == "bar":
        if records_count <= 6:
            return "pie", "Vue en proportions pour compléter la comparaison"
        if any(token in q for token in ["évolution", "tendance", "trend", "courbe"]):
            return "line", "Courbe de tendance complémentaire"
        return "line", "Vue en courbe pour identifier les tendances"
    
    # If primary is pie → secondary is bar (detailed comparison)
    if primary_type == "pie":
        return "bar", "Détail en barres pour une lecture précise des valeurs"
    
    # If primary is line → secondary is bar (snapshot view)
    if primary_type == "line":
        return "bar", "Vue en barres pour un instantané des valeurs"
    
    # If primary is radar → secondary is bar (detailed breakdown)
    if primary_type == "radar":
        return "bar", "Détail en barres des dimensions du profil"
    
    return None


def build_multi_visualizations(
    question: str, 
    aggregates: list[dict], 
    dimension_key: str = "", 
    metric_key: str = "value",
    product_data: list[dict] | None = None,
    channel_data: list[dict] | None = None,
) -> list[dict]:
    """
    Build multiple Vega-Lite specifications for a comprehensive visualization suite.
    
    Returns a list of dicts, each containing:
        - spec: Vega-Lite specification
        - chart_type: Type of chart
        - why: Reasoning
        - role: "primary" | "secondary" | "product" | "channel"
    """
    visualizations = []
    
    # 1. Primary chart
    primary_type, primary_why = choose_chart_type(question, len(aggregates), dimension_key)
    primary_spec = build_vega_lite_spec(primary_type, aggregates, dimension_key, metric_key)
    if primary_spec:
        visualizations.append({
            "spec": primary_spec,
            "chart_type": primary_type,
            "why": primary_why,
            "role": "primary",
        })
    
    # 2. Secondary chart (complementary view of same data)
    secondary = choose_secondary_chart_type(primary_type, question, len(aggregates), dimension_key)
    if secondary and len(aggregates) >= 2:
        sec_type, sec_why = secondary
        sec_spec = build_vega_lite_spec(sec_type, aggregates, dimension_key, metric_key)
        if sec_spec:
            # Update title for secondary
            sec_spec["title"] = sec_spec.get("title", "") + " — Vue alternative"
            visualizations.append({
                "spec": sec_spec,
                "chart_type": sec_type,
                "why": sec_why,
                "role": "secondary",
            })
    
    # 3. Product comparison chart (if product data available)
    if product_data and len(product_data) >= 2:
        product_spec = build_product_comparison_spec(product_data)
        if product_spec:
            visualizations.append({
                "spec": product_spec,
                "chart_type": "bar",
                "why": "Comparaison des produits par note et avis clients",
                "role": "product",
            })
    
    # 4. Channel chart (if channel data available and not already shown)
    if channel_data and len(channel_data) >= 2 and dimension_key not in ["canal_prefere", "purchase_channel"]:
        channel_spec = build_vega_lite_spec("bar", channel_data, "name", "value")
        if channel_spec:
            channel_spec["title"] = "Performance des canaux marketing"
            visualizations.append({
                "spec": channel_spec,
                "chart_type": "bar",
                "why": "Distribution des canaux d'achat préférés",
                "role": "channel",
            })
    
    return visualizations


def build_vega_lite_spec(chart_type: str, rows: list[dict], dimension_key: str = "", metric_key: str = "value") -> dict:
    """
    Build a Vega-Lite specification for the given chart type and data.
    
    Args:
        chart_type: Type of chart (bar, pie, line, radar, scatter, area)
        rows: Data rows to visualize
        dimension_key: The dimension field name (e.g., 'name', 'gouvernorat')
        metric_key: The metric field name (e.g., 'value', 'purchase_count')
    
    Returns:
        Vega-Lite specification dictionary
    """
    if not rows:
        return {}
    
    # Determine field names from data
    first_row = rows[0]
    
    # Find the dimension field (usually 'name' or the first non-numeric field)
    if dimension_key and dimension_key in first_row:
        dim_field = dimension_key
    else:
        dim_field = next((k for k in first_row.keys() if k not in ["value", "purchase_count", "count"] and not isinstance(first_row[k], (int, float))), "name")
    
    # Find the metric field (usually 'value' or 'purchase_count')
    if metric_key and metric_key in first_row:
        met_field = metric_key
    else:
        met_field = next((k for k in first_row.keys() if k in ["value", "purchase_count", "count"] or isinstance(first_row[k], (int, float))), "value")
    
    # Generate appropriate labels
    dim_label = format_field_label(dim_field)
    met_label = format_field_label(met_field)
    
    if chart_type == "pie":
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": f"Répartition par {dim_label}",
            "data": {"values": rows},
            "mark": {"type": "arc", "innerRadius": 50, "outerRadius": 100},
            "encoding": {
                "theta": {"field": met_field, "type": "quantitative", "title": met_label},
                "color": {
                    "field": dim_field, 
                    "type": "nominal",
                    "title": dim_label,
                    "scale": {"scheme": "category20"}
                },
                "tooltip": [
                    {"field": dim_field, "type": "nominal", "title": dim_label},
                    {"field": met_field, "type": "quantitative", "title": met_label}
                ],
            },
        }
    
    if chart_type == "line":
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": f"Tendance par {dim_label}",
            "data": {"values": rows},
            "mark": {"type": "line", "point": {"size": 80}, "strokeWidth": 2.5},
            "encoding": {
                "x": {
                    "field": dim_field, 
                    "type": "ordinal",
                    "title": dim_label,
                    "axis": {"labelAngle": -45}
                },
                "y": {
                    "field": met_field, 
                    "type": "quantitative",
                    "title": met_label
                },
                "tooltip": [
                    {"field": dim_field, "type": "nominal", "title": dim_label},
                    {"field": met_field, "type": "quantitative", "title": met_label}
                ],
            },
        }
    
    if chart_type == "area":
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": f"Évolution par {dim_label}",
            "data": {"values": rows},
            "mark": {"type": "area", "line": True, "point": {"size": 60}, "opacity": 0.4},
            "encoding": {
                "x": {
                    "field": dim_field, 
                    "type": "ordinal",
                    "title": dim_label,
                    "axis": {"labelAngle": -45}
                },
                "y": {
                    "field": met_field, 
                    "type": "quantitative",
                    "title": met_label
                },
                "tooltip": [
                    {"field": dim_field, "type": "nominal", "title": dim_label},
                    {"field": met_field, "type": "quantitative", "title": met_label}
                ],
            },
        }
    
    if chart_type == "radar":
        # Radar chart - data format for frontend polar rendering
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": "Profil multi-dimensionnel",
            "description": "radar",
            "data": {"values": rows},
            "mark": {"type": "line", "point": True},
            "encoding": {
                "x": {
                    "field": dim_field, 
                    "type": "nominal",
                    "title": dim_label
                },
                "y": {
                    "field": met_field, 
                    "type": "quantitative",
                    "title": met_label
                },
                "tooltip": [
                    {"field": dim_field, "type": "nominal", "title": dim_label},
                    {"field": met_field, "type": "quantitative", "title": met_label}
                ],
            },
        }
    
    if chart_type == "scatter":
        # Need at least 2 numeric fields for scatter
        numeric_fields = [k for k in first_row.keys() if isinstance(first_row[k], (int, float))]
        if len(numeric_fields) >= 2:
            x_field = numeric_fields[0]
            y_field = numeric_fields[1]
        else:
            x_field = dim_field
            y_field = met_field
        
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "title": f"Corrélation {format_field_label(x_field)} × {format_field_label(y_field)}",
            "description": "scatter",
            "data": {"values": rows},
            "mark": {"type": "point", "size": 80, "opacity": 0.7},
            "encoding": {
                "x": {
                    "field": x_field,
                    "type": "quantitative",
                    "title": format_field_label(x_field)
                },
                "y": {
                    "field": y_field,
                    "type": "quantitative",
                    "title": format_field_label(y_field)
                },
                "color": {
                    "field": dim_field,
                    "type": "nominal",
                    "title": dim_label
                } if dim_field != x_field else {},
                "tooltip": [
                    {"field": x_field, "type": "quantitative", "title": format_field_label(x_field)},
                    {"field": y_field, "type": "quantitative", "title": format_field_label(y_field)},
                ],
            },
        }
    
    # Default: Bar chart
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": f"Comparaison par {dim_label}",
        "data": {"values": rows},
        "mark": {
            "type": "bar", 
            "cornerRadiusTopLeft": 4, 
            "cornerRadiusTopRight": 4,
            "tooltip": True
        },
        "encoding": {
            "x": {
                "field": dim_field, 
                "type": "nominal",
                "title": dim_label,
                "sort": "-y",
                "axis": {"labelAngle": -45}
            },
            "y": {
                "field": met_field, 
                "type": "quantitative",
                "title": met_label
            },
            "color": {
                "field": dim_field, 
                "type": "nominal",
                "legend": None,  # Hide legend for bar charts (redundant with x-axis)
                "scale": {"scheme": "category20"}
            },
            "tooltip": [
                {"field": dim_field, "type": "nominal", "title": dim_label},
                {"field": met_field, "type": "quantitative", "title": met_label}
            ],
        },
    }


def build_product_comparison_spec(products: list[dict]) -> dict:
    """Build a bar chart comparing product ratings and review counts."""
    if not products or len(products) < 2:
        return {}
    
    chart_data = []
    for p in products[:8]:
        name = p.get("nom_produit", p.get("name", "Produit"))
        # Truncate long names
        if len(name) > 20:
            name = name[:18] + "…"
        chart_data.append({
            "name": name,
            "note": round(float(p.get("avis_moyen", p.get("note", 0))), 1),
            "avis": int(p.get("nb_avis", p.get("avis", 0))),
        })
    
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": "Comparaison des produits — Note & Avis",
        "data": {"values": chart_data},
        "mark": {
            "type": "bar",
            "cornerRadiusTopLeft": 4,
            "cornerRadiusTopRight": 4,
            "tooltip": True,
        },
        "encoding": {
            "x": {
                "field": "name",
                "type": "nominal",
                "title": "Produit",
                "sort": "-y",
                "axis": {"labelAngle": -45},
            },
            "y": {
                "field": "note",
                "type": "quantitative",
                "title": "Note moyenne",
                "scale": {"domain": [0, 5]},
            },
            "color": {
                "field": "name",
                "type": "nominal",
                "legend": None,
                "scale": {"scheme": "category20"},
            },
            "tooltip": [
                {"field": "name", "type": "nominal", "title": "Produit"},
                {"field": "note", "type": "quantitative", "title": "Note"},
                {"field": "avis", "type": "quantitative", "title": "Nb d'avis"},
            ],
        },
    }


def build_product_trend_spec(products: list[dict]) -> dict:
    """Build a chart showing product trends (Croissante/Stable/Décroissante)."""
    if not products:
        return {}
    
    trend_map = {"Très croissante": 5, "Croissante": 4, "Stable": 3, "Décroissante": 2, "Très décroissante": 1}
    chart_data = []
    for p in products[:10]:
        name = p.get("nom_produit", p.get("name", "Produit"))
        if len(name) > 20:
            name = name[:18] + "…"
        trend = p.get("tendance_2024", "Stable")
        chart_data.append({
            "name": name,
            "value": trend_map.get(trend, 3),
            "tendance": trend,
        })
    
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "title": "Tendances des produits 2024",
        "data": {"values": chart_data},
        "mark": {"type": "bar", "cornerRadiusTopLeft": 4, "cornerRadiusTopRight": 4},
        "encoding": {
            "x": {
                "field": "name",
                "type": "nominal",
                "title": "Produit",
                "sort": "-y",
                "axis": {"labelAngle": -45},
            },
            "y": {
                "field": "value",
                "type": "quantitative",
                "title": "Score de tendance",
            },
            "color": {
                "field": "tendance",
                "type": "nominal",
                "title": "Tendance",
                "scale": {"scheme": "category10"},
            },
            "tooltip": [
                {"field": "name", "type": "nominal", "title": "Produit"},
                {"field": "tendance", "type": "nominal", "title": "Tendance 2024"},
            ],
        },
    }


def format_field_label(field_name: str) -> str:
    """
    Format field names into human-readable labels.
    
    Args:
        field_name: The field name (e.g., 'gouvernorat', 'purchase_count')
    
    Returns:
        Formatted label (e.g., 'Gouvernorat', "Nombre d'achats")
    """
    label_map = {
        "gouvernorat": "Gouvernorat",
        "region": "Région",
        "tranche_age": "Tranche d'âge",
        "age_range": "Tranche d'âge",
        "genre": "Genre",
        "gender": "Genre",
        "canal_prefere": "Canal préféré",
        "purchase_channel": "Canal d'achat",
        "niveau_revenu": "Niveau de revenu",
        "ses": "Niveau socio-économique",
        "purchase_count": "Nombre d'achats",
        "count": "Nombre",
        "value": "Valeur",
        "panier_moyen_tnd": "Panier moyen (TND)",
        "name": "Catégorie",
        "segment": "Segment",
        "note": "Note moyenne",
        "avis": "Nombre d'avis",
        "prix_tnd": "Prix (TND)",
        "avis_moyen": "Note moyenne",
        "nb_avis": "Nombre d'avis",
        "tendance_2024": "Tendance 2024",
        "categorie": "Catégorie",
        "nom_produit": "Produit",
    }
    
    return label_map.get(field_name, field_name.replace("_", " ").title())
