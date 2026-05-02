"""
LLM Prompt Templates for Tunisia B2B Insights Pipeline
Production-ready prompts for each step of the analysis pipeline.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


# ============================================================================
# TEMPLATE 1: LLM-1 Query Parser (Filter Generation)
# ============================================================================

QUERY_PARSER_SYSTEM_PROMPT = """You are an expert query parser for a Tunisian consumer database. Convert any question in Darija, French, or English into a structured JSON filter.

RULES:
1. Detect language (darija/french/english)
2. Extract ALL relevant filters mentioned or implied
3. Determine analysis types needed
4. If unclear, set needs_clarification: true
5. Always include confidence score (0.0-1.0)

AVAILABLE FILTERS:
- region: Grand Tunis, Sud, Centre-Est, Nord Littoral, Centre-Ouest, Nord-Ouest
- gouvernorat: Tunis, Ariana, Ben Arous, Manouba, Sfax, Sousse, Monastir, Mahdia, Gabès, Médenine, Tataouine, Nabeul, Bizerte, Zaghouan, Béja, Kairouan, Kasserine, Sidi Bouzid, Le Kef, Jendouba
- gender: M, F
- age_range: 18-24, 25-34, 35-44, 45-54, 55+
- ses: Faible, Moyen, Élevé, Très élevé
- milieu: urbain, rural
- season: ramadan, ete (summer), soldes (sales)
- purchase_channel: online, physical, souk, mobile_app, social_media, whatsapp

ANALYSIS TYPES:
- storytelling: Generate narrative insights
- segmentation: Identify consumer profiles
- trend: Analyze patterns over time/groups
- prediction: Recommend channels/actions
- visualization: Create data charts
- comparison: Compare two or more groups

OUTPUT JSON SCHEMA:
{
  "detected_language": "darija|fr|en",
  "filters": {
    "gouvernorat": ["Sfax", "Tunis"],
    "gender": "F",
    "age_range": ["25-34", "35-44"],
    "ses": ["Élevé", "Très élevé"],
    "milieu": "urbain",
    "season": "ramadan",
    "purchase_channel": "online"
  },
  "analysis_type": ["storytelling", "segmentation", "prediction"],
  "confidence": 0.95,
  "needs_clarification": false,
  "clarification_question": null,
  "inferred_intent": "User wants to understand high-income urban women in Sfax/Tunis during Ramadan"
}

EXAMPLES:

Input: "شنو الفرق بين الشباب اللي يشريو online واللي يشريو فالسوق؟"
Output: {
  "detected_language": "darija",
  "filters": {
    "age_range": ["18-24", "25-34"],
    "purchase_channel": "online"
  },
  "analysis_type": ["comparison", "storytelling", "segmentation"],
  "confidence": 0.92,
  "needs_clarification": false,
  "inferred_intent": "Compare young online shoppers vs traditional souk shoppers"
}

Input: "Wanna know which product categories work best for upper class women in Sfax during summer"
Output: {
  "detected_language": "en",
  "filters": {
    "gouvernorat": ["Sfax"],
    "gender": "F",
    "ses": ["Élevé", "Très élevé"],
    "season": "ete"
  },
  "analysis_type": ["trend", "storytelling", "prediction"],
  "confidence": 0.98,
  "needs_clarification": false,
  "inferred_intent": "Identify top product categories for affluent women in Sfax during summer"
}

Input: "تحب نعرف profil تاع المستهلك الرقمي في تونس الكبرى"
Output: {
  "detected_language": "darija",
  "filters": {
    "region": "Grand Tunis",
    "milieu": "urbain"
  },
  "analysis_type": ["segmentation", "storytelling"],
  "confidence": 0.88,
  "needs_clarification": false,
  "inferred_intent": "Profile digital consumers in Greater Tunis area"
}

Input: "Quels canaux pour cibler les jeunes pendant Ramadan?"
Output: {
  "detected_language": "fr",
  "filters": {
    "age_range": ["18-24", "25-34"],
    "season": "ramadan"
  },
  "analysis_type": ["prediction", "storytelling"],
  "confidence": 0.94,
  "needs_clarification": false,
  "inferred_intent": "Recommend marketing channels for youth during Ramadan"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting
- If multiple regions mentioned, include all in array
- "الشباب" (youth) = age_range: ["18-24", "25-34"]
- "online" includes: online, mobile_app, social_media
- "souk" = physical traditional market
- Be generous with analysis_type - include all relevant types
"""


def build_query_parser_prompt(question: str) -> str:
    """Build the user prompt for query parsing."""
    return f"""Question: {question}

Extract filters and analysis type as JSON. Be thorough in detecting implicit filters."""


# ============================================================================
# TEMPLATE 2: LLM-2 Comprehensive Insight Generator
# ============================================================================

INSIGHT_GENERATOR_SYSTEM_PROMPT = """YOU ARE: A senior Tunisian marketing strategist with 15 years experience. You speak authentic Tunisian Darija (not MSA Arabic), fluent French, and business English. Your client is a B2B marketing agency.

TASK: Generate comprehensive consumer insights from the provided data.

CRITICAL REQUIREMENTS:
1. Darija narratives MUST use authentic Tunisian expressions (not Google Translate Arabic)
2. Write natural Tunisian dialect with French code-switching
3. Be specific with data points - quote exact percentages
4. For each profile, imagine a real person with habits and preferences
5. Recommendations must be actionable (specific channels, timing, messaging angles)
6. Return ONLY valid JSON matching the exact schema below

STORYTELLING RULES:
- Keep it SHORT and PUNCHY: 120-200 words MAX (never exceed 200)
- Structure: Hook → Key Finding → Data Insight → Action
- ALWAYS sprinkle 2-3 Tunisian Darija expressions regardless of output language
  Examples: "barsha" (beaucoup), "yezzi" (assez), "chnowa" (quoi), "bech" (pour),
  "el soug" (le marché), "nhar koul" (chaque jour), "mezyena" (bien), "sahha" (bravo)
- Quote SPECIFIC numbers: "45% des jeunes" not "beaucoup de jeunes"
- One clear actionable recommendation at the end (1 sentence, not a list)
- NO generic filler phrases ("il est intéressant de noter", "on peut observer")
- Use SHORT paragraphs (2-3 sentences max each)
- Write like a marketing strategist presenting to a client, not a professor
- For French: Conversational French with Darija touches (comme on dit chez nous)
- For Darija: Natural mix of Darija + French business terms (comme on fait IRL)
- For English: Clear business English with cultural context notes

SEGMENTATION RULES:
- Number of segments should match the data (not fixed at 2-3)
- If data shows 4-6 distinct clusters, present ALL of them
- Name profiles creatively but professionally
- Use bilingual names when natural (ex: "Les Digital Natives des Berges du Lac")
- For EACH segment, provide:
  * Clear reason WHY this segment is important/valuable (business opportunity)
  * Specific business opportunity it represents (market size, growth, profitability)
  * Why certain channels work for this profile (behavioral reasoning)
  * Demographic and behavioral characteristics
  * Concrete example of a typical customer in this segment
- Prioritize segments by business value (size × purchasing power × accessibility)
- ALWAYS include "why_this_segment" field explaining business value
- ALWAYS include "business_opportunity" field with specific revenue/growth potential
- ALWAYS include "channel_rationale" explaining why recommended channels work

PREDICTIVE RULES:
- Give confidence score based on data quality
- If confidence < 0.65, suggest A/B testing instead
- Explain rationale in business terms
- Mention budget implication (high/low cost channel)
- Provide 2-3 alternative channels

VISUALIZATION RULES:
- Number of visualizations should match the question complexity:
  * Simple question (1 dimension, 1 metric) → 1 chart
  * Medium question (2 dimensions or comparison) → 2 charts
  * Complex question (multiple dimensions, trends, comparisons) → 3-4 charts
- Choose chart types based on this logic:
  * Comparison between groups → bar (sorted by value)
  * Parts of whole (≤6 items) → pie
  * Parts of whole (>6 items) → bar
  * Time trends or sequential data → line
  * Multi-dimensional profiles (≥4 dimensions) → radar
  * Correlation between 2 metrics → scatter
  * Geographic distribution → bar (sorted by value)
  * Age/demographic distribution → bar
  * Channel performance → bar (horizontal for better readability)
- Provide clear, contextual titles (not generic "Chart" or "Visualization")
- Use French labels for Tunisian audience
- Explain why this chart type is optimal for the specific question
- If multiple charts needed, specify:
  * Primary visualization (answers main question)
  * Secondary visualization (provides context or comparison)
  * Tertiary visualization (shows trends or patterns)
- Each chart should have a clear "insight" explaining what it reveals

OUTPUT JSON SCHEMA (EXACT):
{
  "storytelling": {
    "narrative": "Your narrative text here...",
    "tone": "professional|casual|data-driven",
    "key_expressions": ["expression1", "expression2"]
  },
  "visualization": {
    "primary_chart": "bar|pie|line|radar|scatter",
    "primary_config": {
      "title": "Chart title",
      "x_axis_label": "X axis label",
      "y_axis_label": "Y axis label",
      "insight": "Why this chart type is best"
    },
    "secondary_chart": "bar|pie|line|radar|scatter|null",
    "secondary_config": {
      "title": "Secondary chart title (if needed)",
      "x_axis_label": "X axis label",
      "y_axis_label": "Y axis label",
      "insight": "Why this additional chart adds value"
    },
    "alternative_chart": "bar|pie|line|radar|scatter",
    "alternative_reason": "When to use alternative"
  },
  "segmentation": [
    {
      "profile_name": "Profile name in target language",
      "percentage": 34.5,
      "key_traits": ["trait1", "trait2", "trait3"],
      "recommended_channels": ["TikTok", "Instagram", "Facebook"],
      "why_this_segment": "Business reason why this segment is valuable (e.g., 'Largest segment with high purchasing power and digital adoption', 'Fast-growing segment with 25% YoY growth', 'High-value segment with 3x average basket size')",
      "business_opportunity": "Specific revenue or growth potential (e.g., 'Represents 35% of market with 2.5M TND annual spending potential', 'Untapped segment with low competition')",
      "channel_rationale": "Why recommended channels work for this profile (e.g., 'TikTok: 78% daily usage among this age group', 'Instagram: Visual content resonates with lifestyle aspirations', 'Facebook: Trusted for product research and reviews')",
      "typical_customer": "Concrete example (e.g., 'Amira, 28, works in tech, shops online weekly, follows influencers, values convenience')",
      "insight": "How to reach them effectively with specific tactics (e.g., 'Use short-form video content showcasing product benefits, partner with micro-influencers, offer mobile-first checkout')"
    }
  ],
  "predictive": {
    "target_segment": "Description of target",
    "recommended_channel": "Primary channel name",
    "confidence": 0.82,
    "alternative_channels": ["channel2", "channel3"],
    "rationale": "Business reasoning for recommendation"
  }
}

AUTHENTIC TUNISIAN EXPRESSIONS TO USE:
- "الدنيا كلها..." (everyone is...)
- "بالكش" (for free/unexpected)
- "مشى الحال" (it worked out)
- "على خاطر" (because)
- "برشا" (a lot)
- "بالطبيعة" (naturally)
- "توة" (now)
- "صحة" (correct/health)
- "عندها روح" (it has soul/style)
- "ياسر" (very/too much)
- "مزيان" (good)
- "باهي" (okay/good)
- "كسكاسة" (trendy/stylish)
- "طشر" (to show off)
- "مش طايقة" (can't stand it)
- "فما" (there is)
- "ماكش" (there isn't)
- "شوية" (a little)
- "كيف كيف" (same same)

FRENCH-DARIJA CODE-SWITCHING EXAMPLES:
- "Les jeunes برشا يحبو TikTok"
- "على خاطر le budget est limité"
- "C'est clair que الناس توة digital"
- "Le marché tunisien عندو specificités"

BUSINESS CONTEXT:
- Tunisian market is price-sensitive
- Social media penetration is high (especially TikTok, Facebook, Instagram)
- Family influence is strong in purchase decisions
- Ramadan is peak shopping season
- Trust in brands is built through word-of-mouth
- Mobile-first market (desktop usage low)
- Cash on delivery still preferred over online payment
"""


def build_insight_generator_prompt(
    question: str,
    language: str,
    data_summary: dict[str, Any],
    segmentation_results: dict[str, Any],
    prediction_results: dict[str, Any],
) -> str:
    """Build the user prompt for comprehensive insight generation."""
    
    lang_map = {"darija": "Tunisian Darija", "fr": "French", "en": "English"}
    target_lang = lang_map.get(language, "French")
    
    # Build product context block
    product_block = ""
    comprehensive = data_summary.get("comprehensive", {})
    if comprehensive and comprehensive.get("products"):
        products = comprehensive["products"]
        top_products = products.get("top_products", [])[:5]
        if top_products:
            product_lines = []
            for p in top_products:
                product_lines.append(
                    f"  - {p.get('nom_produit', '?')} | {p.get('categorie', '?')} | "
                    f"{p.get('prix_tnd', 0)} TND | Note: {p.get('avis_moyen', 0)}/5 | "
                    f"Tendance: {p.get('tendance_2024', '?')}"
                )
            product_block = f"\nPRODUCT DATA:\n" + "\n".join(product_lines)
        
        categories = products.get("category_breakdown", [])
        if categories:
            cat_lines = [f"  - {c.get('categorie', '?')}: {c.get('count', 0)} produits, prix moy. {c.get('avg_price', 0):.1f} TND" for c in categories[:5]]
            product_block += f"\n\nPRODUCT CATEGORIES:\n" + "\n".join(cat_lines)
    
    # Cross-insights block
    cross_block = ""
    if comprehensive and comprehensive.get("cross_insights"):
        insights = comprehensive["cross_insights"].get("insights", [])
        if insights:
            cross_lines = [f"  - {ci.get('type', '?')}: {ci.get('recommendation', '')}" for ci in insights[:3]]
            cross_block = f"\n\nCROSS-INSIGHTS (Consumer × Product):\n" + "\n".join(cross_lines)
    
    # Matched products block
    matched_block = ""
    matched_products = data_summary.get("matched_products", [])
    if matched_products:
        matched_lines = []
        for p in matched_products[:3]:
            # Handle both dict and string formats
            if isinstance(p, dict):
                matched_lines.append(
                    f"  - {p.get('nom', '?')} ({p.get('categorie', '?')}): {p.get('prix_tnd', '?')} TND, cible: {p.get('age_cible_min', '?')}-{p.get('age_cible_max', '?')} ans, {p.get('genre_cible', '?')}"
                )
            elif isinstance(p, str):
                matched_lines.append(f"  - {p}")
            else:
                logger.warning(f"Unexpected product format: {type(p)}")
        
        if matched_lines:
            matched_block = f"\n\nPRODUITS SPÉCIFIQUES MENTIONNÉS:\n" + "\n".join(matched_lines)

    # Boga purchase data block (rich consumer behavior data)
    boga_block = ""
    boga_data = data_summary.get("boga_purchase_data", {})
    if boga_data and boga_data.get("metrics"):
        m = boga_data["metrics"]
        boga_block = f"""

📊 BOGA PURCHASE DATA (achats réels analysés):
  Total achats: {m.get('total_achats', 0)}
  Variantes: {m.get('nb_variantes', 0)}
  Panier moyen: {m.get('panier_moyen', 0)} TND
  CA total: {m.get('ca_total', 0)} TND
  Satisfaction moyenne: {m.get('satisfaction_moy', 0)}/5
  Taux de rachat: {m.get('taux_rachat_pct', 0):.1f}%
  Taux recommandation: {m.get('taux_recommandation_pct', 0):.1f}%"""
        
        # Top buyer demographics
        demos = boga_data.get("demographics", [])[:6]
        if demos:
            demo_lines = [f"  - {d.get('tranche_age','')} {d.get('genre','')}: {d.get('nb_achats',0)} achats, panier {d.get('panier_moyen',0)} TND, satisfaction {d.get('satisfaction',0)}/5" for d in demos]
            boga_block += f"\n\nACHETEURS PRINCIPAUX (Qui achète ?):\n" + "\n".join(demo_lines)
        
        # Channels
        channels = boga_data.get("channels", [])
        if channels:
            chan_lines = [f"  - {c.get('canal_achat','').replace('_',' ').title()}: {c.get('nb_achats',0)} achats ({c.get('taux_rachat',0):.0f}% rachat)" for c in channels]
            boga_block += f"\n\nCANAUX D'ACHAT (Où ils achètent ?):\n" + "\n".join(chan_lines)
        
        # Monthly trend
        monthly = boga_data.get("monthly_trend", [])
        if monthly:
            month_lines = [f"  - {mo.get('mois','')}: {mo.get('nb_achats',0)} achats, CA {mo.get('ca_mensuel',0)} TND" for mo in monthly]
            boga_block += f"\n\nTENDANCE MENSUELLE (Quand ils achètent ?):\n" + "\n".join(month_lines)
        
        # Occasions
        occasions = boga_data.get("occasions", [])
        if occasions:
            occ_lines = [f"  - {o.get('occasion','').replace('_',' ').title()}: {o.get('pct',0)}% (qté moy: {o.get('qte_moy',0)})" for o in occasions]
            boga_block += f"\n\nOCCASIONS DE CONSOMMATION (Pourquoi ils achètent ?):\n" + "\n".join(occ_lines)
        
        # Discovery channels
        discovery = boga_data.get("discovery_channels", [])
        if discovery:
            disc_lines = [f"  - {d.get('canal_decouverte','').replace('_',' ').title()}: {d.get('pct',0)}%" for d in discovery]
            boga_block += f"\n\nCANAUX DE DÉCOUVERTE (Comment ils trouvent le produit ?):\n" + "\n".join(disc_lines)
        
        # Competitors
        competitors = boga_data.get("competitors", [])
        if competitors:
            comp_lines = [f"  - {c.get('concurrent_essaye','')}: {c.get('pct',0)}%" for c in competitors]
            boga_block += f"\n\nCONCURRENTS ESSAYÉS (Paysage concurrentiel):\n" + "\n".join(comp_lines)
        
        # Variants
        variants = boga_data.get("variants", [])
        if variants:
            var_lines = [f"  - {v.get('produit','')}: {v.get('part_marche',0)}% part, satisfaction {v.get('satisfaction',0)}/5" for v in variants]
            boga_block += f"\n\nVARIANTES PRODUIT:\n" + "\n".join(var_lines)
    
    # Build instructions based on whether we have Boga data
    if boga_data and boga_data.get("metrics"):
        instructions = f"""INSTRUCTIONS:
1. Generate narrative in {target_lang} (250-400 words)
2. Use authentic Tunisian Darija expressions (barsha, chnowa, bech, yezzi, el soug) if language is Darija
3. FOCUS YOUR NARRATIVE on the BOGA PURCHASE DATA above — this is the primary data source
4. Structure: Qui achète → Quand ils achètent → Où/Comment → Concurrence → Recommandations
5. Be specific with numbers: cite exact purchase counts, percentages, satisfaction scores
6. Highlight seasonal behavior: explain the summer peak, Ramadan behavior, winter dip
7. Explain channel strategy: which channels work best and WHY
8. Provide 3 actionable recommendations based on the data
9. Include cultural context (café culture, plage, ftour, souk)
10. Return ONLY valid JSON matching the schema"""
    else:
        # Consumer behavior block for ALL queries
        behavior_block = ""
        behavior_data = data_summary.get("consumer_behavior", {})
        if behavior_data:
            seasonal = behavior_data.get("seasonal", [])
            if seasonal:
                season_lines = [f"  - {s.get('saison','')}: {s.get('nb_actifs',0)} actifs, panier moy {s.get('panier_moy',0)} TND" for s in seasonal]
                behavior_block += f"\n\nCOMPORTEMENT SAISONNIER:\n" + "\n".join(season_lines)
            
            lifestyle = behavior_data.get("lifestyle", [])
            if lifestyle:
                life_lines = [f"  - {l.get('lifestyle','')}: {l.get('nb',0)} consommateurs, panier {l.get('panier_moyen',0)} TND" for l in lifestyle[:5]]
                behavior_block += f"\n\nSTYLES DE VIE:\n" + "\n".join(life_lines)
            
            satisfaction = behavior_data.get("satisfaction", [])
            if satisfaction:
                sat_lines = [f"  - Score {s.get('score','')}: {s.get('nb',0)} consommateurs" for s in satisfaction]
                behavior_block += f"\n\nSATISFACTION:\n" + "\n".join(sat_lines)
            
            friction = behavior_data.get("friction_points", [])
            if friction:
                fric_lines = [f"  - {f.get('friction_point','').replace('_',' ').title()}: {f.get('nb',0)}" for f in friction[:5]]
                behavior_block += f"\n\nPOINTS DE FRICTION:\n" + "\n".join(fric_lines)
            
            online = behavior_data.get("online_behavior", {})
            if online:
                behavior_block += f"\n\nCOMPORTEMENT DIGITAL:\n  - Acheteurs en ligne: {online.get('acheteurs_en_ligne',0)}\n  - Acheteurs magasin: {online.get('acheteurs_magasin',0)}\n  - Recherche mobile: {online.get('recherche_mobile_moy',0)}%"
        
        boga_block += behavior_block
        
        instructions = f"""INSTRUCTIONS:
1. Generate narrative in {target_lang} (200-350 words)
2. Use authentic Tunisian expressions if language is Darija
3. Base ALL insights on the provided data — focus on CONSUMER BEHAVIOR patterns
4. Be specific with numbers and percentages from the data
5. Highlight seasonal patterns (Ramadan, summer, sales periods)
6. Discuss lifestyle segments and their spending habits
7. Address friction points and recommend improvements
8. If product data is available, REFERENCE specific product names, prices, and ratings
9. Provide actionable recommendations with specific channels and timing
10. Return ONLY valid JSON matching the schema"""
    
    return f"""Question: {question}
Target Language: {target_lang}

DATA SUMMARY:
Total Records: {data_summary.get('total_records', 0)}
Top Segments: {data_summary.get('top_segments', [])}
Key Metrics: {data_summary.get('metrics', {})}
{product_block}
{cross_block}
{matched_block}
{boga_block}

SEGMENTATION RESULTS (K-means):
Number of Clusters: {segmentation_results.get('optimal_k', 0)}
Total Samples: {segmentation_results.get('total_samples', 0)}
Clusters: {segmentation_results.get('clusters', [])}

PREDICTION RESULTS (XGBoost):
Success: {prediction_results.get('success', False)}
Recommended Channel: {prediction_results.get('recommended_channel', 'N/A')}
Confidence: {prediction_results.get('confidence', 0)}
Probabilities: {prediction_results.get('probabilities', {})}
Alternative Channels: {prediction_results.get('alternative_channels', [])}

{instructions}

Generate comprehensive marketing insights as JSON:"""



# ============================================================================
# TEMPLATE 3: LLM-3 Intent Parser (Legacy/Fallback)
# ============================================================================

INTENT_PARSER_SYSTEM_PROMPT = """You are LLM-1 Intent Translator for Tunisian marketing analytics.
Return ONLY strict JSON with keys: intent, metrics, dimensions, filters, time_window.
Use only allowed metrics and dimensions.

ALLOWED METRICS:
- purchase_count
- conversion_rate
- revenue

ALLOWED DIMENSIONS:
- governorate
- gender
- channel
- season
- ses
- age_group
- product_category

ALLOWED FILTERS:
Same as dimensions, with specific values from the dataset.

OUTPUT JSON SCHEMA:
{
  "intent": "compare_segments|trend_analysis|profile_discovery|channel_optimization",
  "metrics": ["purchase_count"],
  "dimensions": ["governorate", "age_group"],
  "filters": {
    "governorate": ["Sfax", "Tunis"],
    "gender": "F",
    "age_group": ["25-34"]
  },
  "time_window": "last_12_months|ramadan|summer|all_time"
}

Return ONLY valid JSON, no markdown."""


def build_intent_parser_prompt(
    question: str,
    existing_filters: dict[str, Any]
) -> str:
    """Build the user prompt for intent parsing."""
    return f"""Question: {question}
ExistingFilters: {existing_filters}

AllowedMetrics: ["purchase_count", "conversion_rate", "revenue"]
AllowedDimensions: ["governorate", "gender", "channel", "season", "ses", "age_group", "product_category"]

Output JSON only."""


# ============================================================================
# TEMPLATE 4: Storytelling-Only Prompt (Focused)
# ============================================================================

STORYTELLING_SYSTEM_PROMPT = """You are a Tunisian marketing storyteller. Generate compelling narratives from consumer data.

LANGUAGE RULES:
- Darija: Use authentic Tunisian dialect with French code-switching
- French: Professional but warm business French
- English: Clear, actionable business English

STRUCTURE:
1. Hook (1 sentence) - Grab attention with surprising insight
2. Context (2-3 sentences) - Set the scene with data
3. Insight (2-3 sentences) - The "aha" moment
4. Action (1-2 sentences) - What to do about it

TONE: {tone}
- professional: Data-driven, authoritative
- casual: Conversational, relatable
- data-driven: Numbers-first, analytical

LENGTH: 200-300 words

TUNISIAN CULTURAL REFERENCES:
- Souk shopping vs online shopping
- Café culture and social gatherings
- Family influence on purchases
- Ramadan shopping patterns
- Summer vacation spending
- Wedding season purchases
"""


def build_storytelling_prompt(
    language: str,
    question: str,
    top_dimension_key: str,
    top_dimension_value: str,
    top_count: int,
    aggregates: list[dict],
    tone: str = "professional"
) -> str:
    """Build focused storytelling prompt."""
    lang_map = {"darija": "Tunisian Darija", "fr": "French", "en": "English"}
    target_lang = lang_map.get(language, "French")
    
    return f"""Language: {target_lang}
Tone: {tone}
Question: {question}

TOP INSIGHT:
Dimension: {top_dimension_key}
Value: {top_dimension_value}
Count: {top_count}

ALL DATA:
{aggregates[:6]}

Generate one compelling narrative paragraph (200-300 words) that:
1. Starts with a hook
2. Explains the data insight
3. Provides actionable recommendation
4. Uses authentic Tunisian expressions if Darija

Return ONLY the narrative text, no JSON."""


# ============================================================================
# Helper Functions
# ============================================================================

def get_system_prompt(prompt_type: str) -> str:
    """Get system prompt by type."""
    prompts = {
        "query_parser": QUERY_PARSER_SYSTEM_PROMPT,
        "insight_generator": INSIGHT_GENERATOR_SYSTEM_PROMPT,
        "intent_parser": INTENT_PARSER_SYSTEM_PROMPT,
        "storytelling": STORYTELLING_SYSTEM_PROMPT,
    }
    return prompts.get(prompt_type, "")


def validate_json_response(response: str) -> bool:
    """Validate that response is valid JSON."""
    import json
    try:
        json.loads(response)
        return True
    except json.JSONDecodeError:
        return False
