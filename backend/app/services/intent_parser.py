from __future__ import annotations

import json
from dataclasses import dataclass

from .llm_gateway import BlazeLLMGateway


@dataclass(slots=True)
class ParsedIntent:
    metrics: list[str]
    dimensions: list[str]
    filters: dict[str, str | list[str]]
    time_window: str | None
    intent: str


class IntentParser:
    """
    Placeholder for LLM-1.
    Uses simple heuristics for now with deterministic behavior.
    """

    _metric_keywords = {
        "conversion": "conversion_rate",
        "chiffre": "revenue",
        "revenue": "revenue",
        "achètent": "purchase_count",
        "buy": "purchase_count",
        "يشريو": "purchase_count",
    }

    _dimension_keywords = {
        "jeunes": "age_group",
        "youth": "age_group",
        "femmes": "gender",
        "women": "gender",
        "sfax": "governorate",
        "tunis": "governorate",
        "online": "channel",
        "souk": "channel",
    }

    def __init__(self) -> None:
        self.llm = BlazeLLMGateway()

    def parse(self, question: str, filters: dict[str, str | list[str]]) -> ParsedIntent:
        if self.llm.enabled:
            parsed = self._parse_with_llm(question, filters)
            if parsed is not None:
                return parsed
        return self._parse_heuristic(question, filters)

    def _parse_with_llm(
        self, question: str, filters: dict[str, str | list[str]]
    ) -> ParsedIntent | None:
        from .prompts import INTENT_PARSER_SYSTEM_PROMPT, build_intent_parser_prompt

        system_prompt = INTENT_PARSER_SYSTEM_PROMPT
        user_prompt = build_intent_parser_prompt(question, filters)

        try:
            text = self.llm.chat(system_prompt, user_prompt, temperature=0.0)
            payload = json.loads(text)
            
            allowed_metrics = ["purchase_count", "conversion_rate", "revenue"]
            allowed_dimensions = [
                "governorate",
                "gender",
                "channel",
                "season",
                "ses",
                "age_group",
                "product_category",
            ]
            
            metrics = [m for m in payload.get("metrics", []) if m in allowed_metrics]
            dimensions = [d for d in payload.get("dimensions", []) if d in allowed_dimensions]
            merged_filters = payload.get("filters", {})
            if isinstance(merged_filters, dict):
                merged_filters = {**filters, **merged_filters}
            else:
                merged_filters = filters

            return ParsedIntent(
                metrics=metrics or ["purchase_count"],
                dimensions=dimensions or ["governorate"],
                filters=merged_filters,
                time_window=payload.get("time_window", "last_12_months"),
                intent=payload.get("intent", "compare_segments"),
            )
        except Exception:
            return None

    def _parse_heuristic(self, question: str, filters: dict[str, str | list[str]]) -> ParsedIntent:
        lowered = question.lower()

        metrics = [
            metric
            for token, metric in self._metric_keywords.items()
            if token in lowered
        ]
        dimensions = [
            dim for token, dim in self._dimension_keywords.items() if token in lowered
        ]

        if not metrics:
            metrics = ["purchase_count"]
        if not dimensions:
            dimensions = ["governorate"]

        return ParsedIntent(
            metrics=sorted(set(metrics)),
            dimensions=sorted(set(dimensions)),
            filters=filters,
            time_window="last_12_months",
            intent="compare_segments",
        )
