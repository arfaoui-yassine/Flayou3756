from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Language = Literal["darija", "fr", "en"]


class UserContext(BaseModel):
    agency_name: str | None = None
    campaign_goal: str | None = None


class InsightQueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=800)
    output_language: Language = "fr"
    filters: dict[str, str | list[str]] = Field(default_factory=dict)
    user_context: UserContext | None = None


class StorytellingResponse(BaseModel):
    language: Language
    text: str
    confidence: float


class VisualizationResponse(BaseModel):
    chart_type: Literal["bar", "pie", "line", "radar", "scatter", "area", "stacked-bar"]
    vega_lite_spec: dict
    why_this_chart: str
    chart_role: str = "primary"  # primary | secondary | tertiary | channel | product


class SegmentItem(BaseModel):
    name: str
    pct: float
    attributes: list[str]
    confidence: float
    why_this_segment: str | None = None
    business_opportunity: str | None = None
    channel_rationale: str | None = None
    avg_basket_tnd: float | None = None
    insight: str | None = None


class SegmentationResponse(BaseModel):
    method: str
    segments: list[SegmentItem]


class ChannelRecommendation(BaseModel):
    channel: str
    score: float


class PredictiveResponse(BaseModel):
    model: str
    target_profile: str
    conversion_prob: float
    channel_recommendations: list[ChannelRecommendation]
    explainability: dict[str, list[str] | str]  # Allow both list and string values


class TraceResponse(BaseModel):
    request_id: str
    dataset_version: str
    prompt_version: str
    model_versions: dict[str, str]
    latency_ms: int


class ProductRecommendation(BaseModel):
    nom_produit: str
    categorie: str
    prix_tnd: float
    prix_segment: str
    avis_moyen: float | None = None
    strategie_marketing: str | None = None
    influenceur_type: str | None = None
    canal_vente_principal: str | None = None


class InsightQueryResponse(BaseModel):
    storytelling: StorytellingResponse
    visualization: VisualizationResponse
    visualizations: list[VisualizationResponse] = Field(default_factory=list)
    segmentation: SegmentationResponse
    predictive: PredictiveResponse
    product_recommendations: list[ProductRecommendation] = Field(default_factory=list)
    trace: TraceResponse
