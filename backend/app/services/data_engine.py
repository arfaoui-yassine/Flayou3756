from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import duckdb
import pandas as pd

logger = logging.getLogger(__name__)

ALLOWED_FILTER_COLUMNS = {
    "governorate",
    "gouvernorat",
    "gender",
    "genre",
    "channel",
    "season",
    "ses",
    "age_group",
    "age_range",
    "product_category",
    "milieu",
    "region",
}

CANONICAL_TO_DATASET_COLUMN = {
    "governorate": "gouvernorat",
    "gender": "genre",
    "channel": "canaux_utilises",
    "season": "season",
    "ses": "tranche_revenu",
    "age_group": "tranche_age",
    "age_range": "tranche_age",
    "product_category": "categories_achetees",
    "milieu": "milieu",
    "region": "region",
}


class DataEngine:
    """
    Enhanced data engine with DuckDB for efficient CSV querying.
    Supports filtering, aggregation, and data extraction for ML models.
    """

    def __init__(self, csv_path: Path) -> None:
        self.csv_path = csv_path
        logger.info(f"DataEngine initialized with CSV: {csv_path}")

    def _validate_filters(self, filters: dict[str, str | list[str]]) -> dict[str, str | list[str]]:
        """Validate filter keys against allowed columns."""
        for key in filters:
            if key not in ALLOWED_FILTER_COLUMNS:
                logger.warning(f"Unsupported filter ignored: {key}")
                # Don't raise, just skip invalid filters
        return {k: v for k, v in filters.items() if k in ALLOWED_FILTER_COLUMNS}

    def _map_dimension(self, dim: str) -> str:
        """Map canonical dimension names to actual CSV column names."""
        return CANONICAL_TO_DATASET_COLUMN.get(dim, dim)

    def _build_filter_sql(self, col: str, value: str | list[str]) -> tuple[str, list[Any]]:
        """Build SQL WHERE clause for a single filter."""
        mapped_col = CANONICAL_TO_DATASET_COLUMN.get(col, col)

        if col == "season":
            season_to_flag = {
                "summer": "ete_actif",
                "ete": "ete_actif",
                "ramadan": "ramadan_actif",
                "sale": "soldes_actif",
                "soldes": "soldes_actif",
            }
            season_value = value[0] if isinstance(value, list) and value else value
            if isinstance(season_value, str) and season_value.lower() in season_to_flag:
                return f"{season_to_flag[season_value.lower()]} = ?", [True]
            raise ValueError("Unsupported season value. Use summer/ete, ramadan, or soldes.")

        # "channel" and "product_category" are pipe-separated list-like columns in CSV.
        if col in {"channel", "product_category"}:
            values = value if isinstance(value, list) else [value]
            parts = []
            params: list[Any] = []
            for val in values:
                parts.append(f"{mapped_col} ILIKE ?")
                params.append(f"%{val}%")
            return f"({' OR '.join(parts)})", params

        if isinstance(value, list):
            placeholders = ", ".join(["?"] * len(value))
            return f"{mapped_col} IN ({placeholders})", list(value)
        return f"{mapped_col} = ?", [value]

    def get_filtered_data(self, filters: dict[str, str | list[str]], limit: int = 5000) -> pd.DataFrame:
        """
        Get filtered raw data as DataFrame for ML processing.
        Returns all columns for the filtered rows.
        """
        validated = self._validate_filters(filters)
        con = duckdb.connect()

        where_parts: list[str] = []
        params: list[Any] = [str(self.csv_path)]
        
        for col, value in validated.items():
            sql_part, sql_params = self._build_filter_sql(col, value)
            where_parts.append(sql_part)
            params.extend(sql_params)

        where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
        
        query = f"""
            SELECT *
            FROM read_csv_auto(?)
            {where_sql}
            LIMIT ?
        """
        params.append(limit)
        
        df = con.execute(query, params).df()
        con.close()
        logger.info(f"Filtered data: {len(df)} rows")
        return df

    def get_aggregated_metrics(
        self, 
        filters: dict[str, str | list[str]], 
        groupby_cols: list[str] | None = None
    ) -> dict[str, Any]:
        """
        Get aggregated metrics for filtered data.
        Returns summary statistics grouped by specified columns.
        """
        validated = self._validate_filters(filters)
        con = duckdb.connect()

        where_parts: list[str] = []
        params: list[Any] = [str(self.csv_path)]
        
        for col, value in validated.items():
            sql_part, sql_params = self._build_filter_sql(col, value)
            where_parts.append(sql_part)
            params.extend(sql_params)

        where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
        
        if groupby_cols:
            mapped_cols = [self._map_dimension(col) for col in groupby_cols]
            group_by_sql = ", ".join(mapped_cols)
            query = f"""
                SELECT 
                    {group_by_sql},
                    COUNT(*) as count,
                    AVG(panier_moyen_tnd) as avg_basket,
                    SUM(panier_moyen_tnd) as total_revenue,
                    AVG(satisfaction_globale) as avg_satisfaction
                FROM read_csv_auto(?)
                {where_sql}
                GROUP BY {group_by_sql}
                ORDER BY count DESC
                LIMIT 50
            """
        else:
            query = f"""
                SELECT 
                    COUNT(*) as total_count,
                    AVG(panier_moyen_tnd) as avg_basket,
                    SUM(panier_moyen_tnd) as total_revenue,
                    AVG(satisfaction_globale) as avg_satisfaction,
                    AVG(age) as avg_age,
                    COUNT(DISTINCT gouvernorat) as unique_regions
                FROM read_csv_auto(?)
                {where_sql}
            """
        
        result = con.execute(query, params).df()
        con.close()
        
        if groupby_cols:
            return {"grouped_data": result.to_dict(orient="records")}
        else:
            return result.to_dict(orient="records")[0] if len(result) > 0 else {}

    def get_trend_data(
        self, 
        filters: dict[str, str | list[str]], 
        time_column: str = "tranche_age"
    ) -> list[dict[str, Any]]:
        """
        Get trend data over time or age groups.
        Useful for line charts and temporal analysis.
        """
        validated = self._validate_filters(filters)
        con = duckdb.connect()

        where_parts: list[str] = []
        params: list[Any] = [str(self.csv_path)]
        
        for col, value in validated.items():
            sql_part, sql_params = self._build_filter_sql(col, value)
            where_parts.append(sql_part)
            params.extend(sql_params)

        where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
        mapped_time_col = self._map_dimension(time_column)
        
        query = f"""
            SELECT 
                {mapped_time_col} as period,
                COUNT(*) as count,
                AVG(panier_moyen_tnd) as avg_basket,
                AVG(satisfaction_globale) as avg_satisfaction
            FROM read_csv_auto(?)
            {where_sql}
            GROUP BY {mapped_time_col}
            ORDER BY {mapped_time_col}
        """
        
        result = con.execute(query, params).df()
        con.close()
        return result.to_dict(orient="records")

    def get_correlation_matrix(self, filters: dict[str, str | list[str]]) -> dict[str, Any]:
        """
        Get correlation matrix for numeric columns.
        Useful for understanding relationships between variables.
        """
        df = self.get_filtered_data(filters, limit=2000)
        
        numeric_cols = [
            "age", "revenu_mensuel_tnd", "panier_moyen_tnd", 
            "satisfaction_globale", "nps", "nb_canaux"
        ]
        
        available_cols = [col for col in numeric_cols if col in df.columns]
        
        if not available_cols:
            return {}
        
        corr_matrix = df[available_cols].corr()
        return corr_matrix.to_dict()

    def aggregate(
        self, metrics: list[str], dimensions: list[str], filters: dict[str, str | list[str]]
    ) -> list[dict[str, Any]]:
        """
        Aggregate data by the given dimensions, capped at 10 clean items.
        Avoids pipe-separated columns — falls back to gouvernorat if needed.
        """
        validated = self._validate_filters(filters)
        con = duckdb.connect()

        where_parts: list[str] = []
        params: list[Any] = []
        for col, value in validated.items():
            sql_part, sql_params = self._build_filter_sql(col, value)
            where_parts.append(sql_part)
            params.extend(sql_params)

        where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""

        # Avoid pipe-separated columns as chart dimensions — they produce unreadable labels
        PIPE_COLUMNS = {"categories_achetees", "canaux_utilises", "marques_preferees"}
        mapped_dimensions = [self._map_dimension(dim) for dim in dimensions] if dimensions else []

        # Filter out pipe-separated columns from chart dimensions
        clean_dims = [d for d in mapped_dimensions if d not in PIPE_COLUMNS]

        # Fall back to gouvernorat if no clean dimension available
        if not clean_dims:
            clean_dims = ["gouvernorat"]

        # Use only the first dimension for clean charts
        primary_dim = clean_dims[0]
        group_by = primary_dim
        metric_sql = "COUNT(*) AS purchase_count"

        query = f"""
            SELECT {group_by}, {metric_sql}
            FROM read_csv_auto(?)
            {where_sql}
            GROUP BY {group_by}
            ORDER BY purchase_count DESC
            LIMIT 10
        """
        params = [str(self.csv_path), *params]
        rows = con.execute(query, params).df()
        con.close()

        result = rows.to_dict(orient="records")
        # Normalize: rename the dimension column to 'name' for chart compatibility
        normalized = []
        for row in result:
            entry = {"name": str(row.get(primary_dim, "?")).strip(), "value": row.get("purchase_count", 0)}
            normalized.append(entry)
        return normalized

    def aggregate_category_split(
        self, filters: dict[str, str | list[str]], column: str = "categories_achetees", top_n: int = 8
    ) -> list[dict[str, Any]]:
        """
        Special aggregator for pipe-separated columns like categories_achetees.
        Splits 'sport|mode|alimentation' into individual category counts.
        Returns top_n categories by count.
        """
        df = self.get_filtered_data(filters, limit=3000)
        if column not in df.columns:
            return []

        from collections import Counter
        counts: Counter = Counter()
        for val in df[column].dropna():
            for cat in str(val).split("|"):
                cat = cat.strip()
                if cat:
                    counts[cat] += 1

        top = counts.most_common(top_n)
        return [{"name": cat, "value": cnt} for cat, cnt in top]

    def aggregate_channel_split(
        self, filters: dict[str, str | list[str]], top_n: int = 8
    ) -> list[dict[str, Any]]:
        """Split canaux_utilises pipe-separated values into individual channel counts."""
        return self.aggregate_category_split(filters, column="canaux_utilises", top_n=top_n)

    def raw_frame(self, limit: int = 2000) -> pd.DataFrame:
        """Get raw data frame without filters."""
        con = duckdb.connect()
        frame = con.execute(
            "SELECT * FROM read_csv_auto(?) LIMIT ?",
            [str(self.csv_path), limit],
        ).df()
        con.close()
        return frame
