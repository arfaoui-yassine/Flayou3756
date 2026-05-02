/**
 * TypeScript types for Tunisia B2B Insights API
 * These types match the backend API response structure exactly
 */

export type Language = "darija" | "fr" | "en";

export type ChartType = "bar" | "pie" | "line" | "radar" | "scatter" | "area" | "stacked-bar";

export interface StorytellingResponse {
  language: Language;
  text: string;
  confidence: number;
}

export interface VegaLiteSpec {
  $schema?: string;
  title?: string;
  data: {
    values: any[];
  };
  mark?: string | { type: string; [key: string]: any };
  encoding?: {
    x?: { field: string; type: string; title?: string; [key: string]: any };
    y?: { field: string; type: string; title?: string; [key: string]: any };
    color?: { field: string; type: string; [key: string]: any };
    theta?: { field: string; type: string; [key: string]: any };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface VisualizationResponse {
  chart_type: ChartType;
  vega_lite_spec: VegaLiteSpec;
  why_this_chart: string;
  chart_role?: string; // primary | secondary | tertiary | channel | product
}

export interface SegmentItem {
  name: string;
  pct: number;
  attributes: string[];
  confidence: number;
  why_this_segment?: string; // Raison pour laquelle ce segment est proposé
  insight?: string; // Insight sur comment atteindre ce segment
}

export interface SegmentationResponse {
  method: string;
  segments: SegmentItem[];
}

export interface ChannelRecommendation {
  channel: string;
  score: number;
}

export interface PredictiveResponse {
  model: string;
  target_profile: string;
  conversion_prob: number;
  channel_recommendations: ChannelRecommendation[];
  explainability: {
    top_features: string[];
    confidence_level?: string;
    [key: string]: string[] | string | undefined;
  };
}

export interface ProductRecommendation {
  nom_produit: string;
  categorie: string;
  prix_tnd: number;
  prix_segment: string;
  avis_moyen?: number;
  strategie_marketing?: string;
  influenceur_type?: string;
  canal_vente_principal?: string;
}

export interface TraceResponse {
  request_id: string;
  dataset_version: string;
  prompt_version: string;
  model_versions: Record<string, string>;
  latency_ms: number;
}

export interface InsightResponse {
  storytelling: StorytellingResponse;
  visualization: VisualizationResponse;
  visualizations: VisualizationResponse[];
  segmentation: SegmentationResponse;
  predictive: PredictiveResponse;
  product_recommendations: ProductRecommendation[];
  trace: TraceResponse;
}

export interface FilterGenerationResponse {
  detected_language: string;
  filters: Record<string, string | string[]>;
  analysis_type: string[];
  confidence?: number;
}

export interface StatsResponse {
  total_records: number;
  unique_regions: number;
  age_distribution: Record<string, number>;
  avg_basket: number;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface InsightQueryRequest {
  question: string;
  output_language: Language;
  filters?: Record<string, string | string[]>;
  user_context?: {
    agency_name?: string;
    campaign_goal?: string;
  };
}
