from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from .schemas import InsightQueryRequest, InsightQueryResponse
from .services.insight_service import InsightService
from .services.unified_data_engine import UnifiedDataEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

app = FastAPI(
    title="AAM BEJI - Tunisia B2B Insights API",
    version="2.0.0",
    description="AI-powered marketing insights for Tunisian consumer data"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data paths
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
CONSUMER_CSV_PATH = DATA_DIR / "profils_consommateurs.csv"
PRODUCT_CSV_PATH = DATA_DIR / "produits_tunisiens.csv"

# Initialize unified data engine with consumer + product data
logger.info("Initializing Unified Data Engine...")
try:
    unified_engine = UnifiedDataEngine(
        consumer_csv_path=CONSUMER_CSV_PATH,
        product_csv_path=PRODUCT_CSV_PATH
    )
    mode = "consumer+product" if unified_engine.has_products else "consumer-only"
    logger.info(f"Unified Data Engine initialized successfully ({mode} mode)")
except Exception as e:
    logger.error(f"Failed to initialize Unified Data Engine: {e}")
    raise

# Initialize insight service with unified engine
service = InsightService(
    csv_path=CONSUMER_CSV_PATH,
    unified_engine=unified_engine
)


class FilterGenerationRequest(BaseModel):
    """Request model for filter generation endpoint."""
    question: str = Field(min_length=3, max_length=800)
    language: str = Field(default="fr", pattern="^(darija|fr|en)$")


class FilterGenerationResponse(BaseModel):
    """Response model for filter generation endpoint."""
    detected_language: str
    filters: dict[str, str | list[str]]
    analysis_type: list[str]


@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "version": "2.0.0"}


@app.post("/api/v1/generate-filters", response_model=FilterGenerationResponse)
def generate_filters(payload: FilterGenerationRequest) -> FilterGenerationResponse:
    """
    Step 1: Generate structured filters from natural language question.
    Uses LLM to detect language, extract filters, and determine analysis type.
    """
    try:
        result = service.llm.generate_filters(
            question=payload.question,
            language=payload.language
        )
        return FilterGenerationResponse(**result)
    except Exception as exc:
        logger.error(f"Filter generation failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/v1/insights/query", response_model=InsightQueryResponse)
def query_insights(payload: InsightQueryRequest) -> InsightQueryResponse:
    """
    Main insight endpoint that orchestrates the complete pipeline:
    1. Parse intent and filters
    2. Query and aggregate data
    3. Perform K-means segmentation
    4. Generate XGBoost predictions
    5. Create comprehensive LLM-based insights
    """
    try:
        result = service.run(
            question=payload.question,
            output_language=payload.output_language,
            filters=payload.filters,
        )
        
        # Validate result structure before creating response
        if not isinstance(result, dict):
            logger.error(f"Service returned non-dict result: {type(result)}")
            raise ValueError(f"Invalid result type: {type(result)}")
        
        # Check for required fields
        required_fields = ["storytelling", "visualization", "segmentation", "predictive", "trace"]
        for field in required_fields:
            if field not in result:
                logger.error(f"Missing required field: {field}")
                raise ValueError(f"Missing required field: {field}")
            if not isinstance(result[field], dict):
                logger.error(f"Field {field} is not a dict: {type(result[field])}")
                raise ValueError(f"Field {field} must be a dict, got {type(result[field])}")
        
        return InsightQueryResponse(**result)
    except ValueError as exc:
        logger.error(f"Validation error: {exc}")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error(f"Insight generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/stats")
def get_stats() -> dict:
    """Get dataset statistics."""
    try:
        df = service.data.raw_frame(limit=10000)
        return {
            "total_records": len(df),
            "unique_regions": df["gouvernorat"].nunique() if "gouvernorat" in df.columns else 0,
            "age_distribution": df["tranche_age"].value_counts().to_dict() if "tranche_age" in df.columns else {},
            "avg_basket": round(df["panier_moyen_tnd"].mean(), 2) if "panier_moyen_tnd" in df.columns else 0,
        }
    except Exception as exc:
        logger.error(f"Stats retrieval failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class BehavioralCurveRequest(BaseModel):
    """Request model for behavioral curve endpoint."""
    product_name: str | None = Field(default=None, description="Optional product name to overlay")
    filters: dict[str, str | list[str]] = Field(default_factory=dict)


@app.post("/api/v1/behavioral-curve")
def get_behavioral_curve(payload: BehavioralCurveRequest) -> dict:
    """
    Generate monthly consumer behavior curve with:
    - Purchase intensity by month
    - Online vs physical channel trends
    - Seasonal transition detection
    - Optional product seasonality overlay
    """
    from .services.behavioral_engine import generate_behavioral_curve
    
    try:
        result = generate_behavioral_curve(
            consumer_csv=CONSUMER_CSV_PATH,
            product_csv=PRODUCT_CSV_PATH,
            filters=payload.filters,
            product_name=payload.product_name,
        )
        return result
    except Exception as exc:
        logger.error(f"Behavioral curve failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

