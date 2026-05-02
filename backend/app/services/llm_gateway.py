from __future__ import annotations

import json
import logging
import os
from typing import Any

from openai import OpenAI

logger = logging.getLogger(__name__)


class BlazeLLMGateway:
    """
    LLM Gateway supporting both Blaze API and OpenAI-compatible endpoints.
    Handles filter generation, intent parsing, and insight storytelling.
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("BLAZE_API_KEY", "")
        self.base_url = os.getenv("BLAZE_BASE_URL", "https://blazeai.boxu.dev/api/")
        self.model = os.getenv("BLAZE_MODEL", "qwen3.6-plus")
        self.enabled = bool(self.api_key)
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url) if self.enabled else None

    def chat(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        """Basic chat completion."""
        if not self.client:
            raise RuntimeError("Blaze LLM is not configured")

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content or ""

    def generate_filters(self, question: str, language: str = "fr") -> dict[str, Any]:
        """
        Step 1: Generate structured filters from natural language question.
        Detects language, extracts filters, and determines analysis type.
        """
        if not self.enabled:
            logger.warning("LLM not enabled, returning empty filters")
            return {
                "detected_language": language,
                "filters": {},
                "analysis_type": ["storytelling", "visualization"],
            }

        from .prompts import QUERY_PARSER_SYSTEM_PROMPT, build_query_parser_prompt

        system_prompt = QUERY_PARSER_SYSTEM_PROMPT
        user_prompt = build_query_parser_prompt(question)

        try:
            response = self.chat(system_prompt, user_prompt, temperature=0.1)
            # Try to extract JSON from response
            response = response.strip()
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                response = response.split("```")[1].split("```")[0].strip()
            
            parsed = json.loads(response)
            logger.info(f"Generated filters: {parsed}")
            return parsed
        except Exception as e:
            logger.error(f"Failed to generate filters: {e}")
            return {
                "detected_language": language,
                "filters": {},
                "analysis_type": ["storytelling", "visualization"],
            }

    def generate_comprehensive_insight(
        self,
        question: str,
        language: str,
        data_summary: dict[str, Any],
        segmentation_results: dict[str, Any],
        prediction_results: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Step 5: Generate comprehensive marketing insights in one LLM call.
        Returns storytelling, visualization recommendations, segment profiles, and predictions.
        """
        if not self.enabled:
            return self._fallback_insight(language, data_summary)

        from .prompts import INSIGHT_GENERATOR_SYSTEM_PROMPT, build_insight_generator_prompt

        system_prompt = INSIGHT_GENERATOR_SYSTEM_PROMPT
        user_prompt = build_insight_generator_prompt(
            question=question,
            language=language,
            data_summary=data_summary,
            segmentation_results=segmentation_results,
            prediction_results=prediction_results,
        )

        try:
            response = self.chat(system_prompt, user_prompt, temperature=0.4)
            response = response.strip()
            
            # Extract JSON from markdown code blocks
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                response = response.split("```")[1].split("```")[0].strip()
            
            # Try to parse JSON
            parsed = json.loads(response)
            
            # Validate that it's a dict with expected structure
            if not isinstance(parsed, dict):
                logger.error(f"LLM returned non-dict JSON: {type(parsed)}")
                return self._fallback_insight(language, data_summary)
            
            # Ensure storytelling exists
            if "storytelling" not in parsed or not isinstance(parsed.get("storytelling"), dict):
                logger.warning("LLM response missing storytelling, using fallback")
                fallback = self._fallback_insight(language, data_summary)
                parsed["storytelling"] = fallback["storytelling"]
            
            logger.info("Generated comprehensive insight successfully")
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            logger.error(f"Raw response: {response[:500]}")
            return self._fallback_insight(language, data_summary)
        except Exception as e:
            logger.error(f"Failed to generate comprehensive insight: {e}")
            return self._fallback_insight(language, data_summary)

    def _fallback_insight(self, language: str, data_summary: dict[str, Any]) -> dict[str, Any]:
        """Fallback insight when LLM is unavailable."""
        narratives = {
            "darija": "حسب الداتا، لقينا نتائج مثيرة للاهتمام. الشريحة المستهدفة تبين نشاط قوي.",
            "fr": "D'après les données, nous avons identifié des tendances intéressantes pour votre campagne.",
            "en": "Based on the data, we've identified interesting trends for your campaign.",
        }
        
        return {
            "storytelling": {
                "narrative": narratives.get(language, narratives["fr"]),
                "tone": "professional",
                "key_expressions": ["data-driven", "actionable"],
            },
            "visualization": {
                "primary_chart": "bar",
                "primary_config": {
                    "title": "Segment Analysis",
                    "x_axis_label": "Segment",
                    "y_axis_label": "Count",
                    "insight": "Bar chart for easy comparison",
                },
                "alternative_chart": "pie",
                "alternative_reason": "Show proportions",
            },
            "segmentation": [],
            "predictive": {
                "target_segment": "General audience",
                "recommended_channel": "Social Media",
                "confidence": 0.65,
                "alternative_channels": ["Mobile App"],
                "rationale": "Based on general trends",
            },
        }
