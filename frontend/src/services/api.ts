/**
 * API Client for Tunisia B2B Insights Backend
 */

import type {
  InsightResponse,
  FilterGenerationResponse,
  StatsResponse,
  HealthResponse,
  Language,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Fetch comprehensive insights from backend
 */
export async function fetchInsights(
  question: string,
  outputLanguage: Language = "fr",
  filters: Record<string, string | string[]> = {}
): Promise<InsightResponse> {
  const response = await fetch(`${API_BASE}/api/v1/insights/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      output_language: outputLanguage,
      filters,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Generate filters from natural language question
 */
export async function generateFilters(
  question: string,
  language: Language = "fr"
): Promise<FilterGenerationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/generate-filters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate filters");
  }

  return response.json();
}

/**
 * Get dataset statistics
 */
export async function getStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/api/v1/stats`);

  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }

  return response.json();
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);

  if (!response.ok) {
    throw new Error("Backend is not healthy");
  }

  return response.json();
}
