import os
import json
import sys
from pydantic import BaseModel, Field
from typing import List
from google import genai
from google.genai import types

# Resolve paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from tools.fetch_current_lorcana_meta import fetch_current_lorcana_meta

# =====================================================================
# 1. Define strict Pydantic Schemas for Deck Enrichment API
# =====================================================================

class CoachingDirective(BaseModel):
    type: str = Field(description="Category (e.g. 'Early Game Adjustment', 'Pivot Moment', 'Inkwell Habit')")
    icon: str = Field(description="One of: 'shuffle', 'activity', 'target', 'shield', 'sword'")
    instruction: str = Field(description="A concise 1-sentence tactical tip recommending specific cards or play patterns.")

class SynergyPair(BaseModel):
    title: str = Field(description="A brief, thematic title for the synergy")
    description: str = Field(description="A short explanation of why these two cards are synergistic.")
    cards: List[str] = Field(description="List of exactly 2 card names from the player's deck or common cards in this color archetype forming this synergy.")

class MulliganInsight(BaseModel):
    card_name: str = Field(description="The card name")
    keep_win_rate: str = Field(description="Win rate when kept, e.g. '62.5%' or 'N/A' if never kept")
    toss_win_rate: str = Field(description="Win rate when tossed, e.g. '40.0%' or 'N/A' if never tossed")
    recommendation: str = Field(description="Must be exactly one of: 'Keep', 'Toss', or 'Neutral'")
    coaching_note: str = Field(description="A concise 1-sentence strategic tip explaining why keeping or tossing correlates with wins in matchups.")

class PivotInsight(BaseModel):
    card_name: str = Field(description="The card name")
    momentum_loss_count: int = Field(description="Integer count of times this card appeared on pivot turns in losses")
    percentage_of_losses: str = Field(description="Percentage representation of pivot loss occurrences, e.g. '40%'")
    coaching_note: str = Field(description="A concise 1-sentence strategic tip on how to play around this momentum loss risk.")

class DeckEnrichmentSchema(BaseModel):
    tags: List[str] = Field(description="List of 2 or 3 strategic tags defining the deck style (e.g. ['Control', 'Late Game'])")
    meta_win_rate: str = Field(description="Archetype win rate in competitive meta, e.g. '53.4%'")
    meta_performance_breakdown: str = Field(description="Professional 2-3 sentence summary of matchup in competitive meta.")
    coaching_directives: List[CoachingDirective] = Field(description="List of exactly 3 actionable improvements.")
    top_improvement: str = Field(description="The single most critical strategic tip for deck improvement.")
    key_synergies: List[SynergyPair] = Field(description="List of exactly 2 key synergy pairs.")
    mulligan_insights: List[MulliganInsight] = Field(description="Enriched mulligan trends, or empty list if insufficient data.")
    pivot_insights: List[PivotInsight] = Field(description="Enriched pivot cards, or empty list if insufficient data.")


def get_deck_analysis_enrichment(snapshot: dict) -> dict:
    """Uses Gemini 2.5 Flash to generate strategic tags, positioning analysis, and coaching directives.

    Args:
        snapshot: The pre-computed deck snapshot dictionary.

    Returns:
        A dictionary containing enriched deck analysis.
    """
    # Initialize genai client
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[MetricsAnalyst] Warning: GEMINI_API_KEY is not set. Using fallback mocks.")
        return _get_fallback_enrichment(snapshot)

    try:
        # Fetch meta for context
        meta_json = fetch_current_lorcana_meta()
        try:
            meta_data = json.loads(meta_json)
        except Exception:
            meta_data = {}

        client = genai.Client(api_key=api_key)
        
        prompt = f"""
You are a master Lorcana Deck Analyst. Analyze the player's personal deck performance metrics snapshot and compare it to the current competitive metagame to generate strategic positioning and actionable coaching directives.

Personal Deck Snapshot:
{json.dumps(snapshot, indent=2)}

Current Lorcana Metagame:
{json.dumps(meta_data, indent=2)}

Your task is to enrich the personal snapshot with high-quality strategic advice. You MUST return a JSON object that satisfies the strict schema.

Guidelines for Mulligan Insights:
- Grouped in mulligan_trends are keep/toss win rates. Devise a strategic recommendation ('Keep', 'Toss', or 'Neutral') for each card listed.
- Distinguish between mechanical decisions (e.g., throwing away high-cost uninkable cards early to prevent clogging your hand) versus strategic matchup choices (e.g. keeping specific card challenged against aggressive colors, or tossing removal against control). Focus your coaching tips on strategic matchups.

Guidelines for Pivot Insights:
- In pivot_cards are cards associated with momentum-loss turns. Formulate a coaching note for each card detailing how to protect or play around this momentum loss risk (e.g., holding back unless you have active ward protection or board clear threats have passed).
"""
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DeckEnrichmentSchema
            )
        )
        
        enrichment = json.loads(response.text)
        
        # Extract and log token usage
        token_usage = {}
        usage = getattr(response, "usage_metadata", None)
        if usage:
            token_usage = {
                "prompt_tokens": getattr(usage, "prompt_token_count", 0),
                "candidates_tokens": getattr(usage, "candidates_token_count", 0),
                "total_tokens": getattr(usage, "total_token_count", 0)
            }
            print(f"[MetricsAnalyst] LLM success. Token usage: {token_usage}")
        else:
            print("[MetricsAnalyst] LLM success. Token usage metadata not available.")
            
        enrichment["token_usage"] = token_usage
        return enrichment

    except Exception as e:
        print(f"[MetricsAnalyst] Error running Gemini deck analysis: {e}")
        fallback = _get_fallback_enrichment(snapshot)
        fallback["token_usage"] = {"prompt_tokens": 0, "candidates_tokens": 0, "total_tokens": 0, "note": "fallback used"}
        return fallback

def _get_fallback_enrichment(snapshot: dict) -> dict:
    deck_colors = snapshot.get("deck_colors", "Unknown")
    return {
        "tags": ["Tempo", "Ramp", "Midrange"] if "Sapphire" in deck_colors or "Steel" in deck_colors else ["Control", "Draw", "Late Game"],
        "meta_win_rate": "54.2%",
        "meta_performance_breakdown": f"Your {deck_colors} deck is showing steady performance. It has favorable matchups against slower control decks, but requires disciplined early game ink management against aggressive setups.",
        "top_improvement": "Increase early game questing pressure to contest aggressive decks.",
        "coaching_directives": [
            {
                "type": "Early Game Adjustment",
                "icon": "shuffle",
                "instruction": "Mulligan aggressively to secure early-turn plays and establish board presence."
            },
            {
                "type": "Inkwell Habit",
                "icon": "target",
                "instruction": "Avoid inking high-value late game threats on turns 1-3 unless absolutely necessary."
            },
            {
                "type": "Matchup Pivot",
                "icon": "shield",
                "instruction": "Against Amber-heavy boards, prioritize challenging opponent characters to disrupt their singer setup."
            }
        ],
        "key_synergies": [
            {
                "title": "Tactical Coordination",
                "description": "Combining early-game questing with combat disruption shifts the pacing index favorably.",
                "cards": ["Palace Guard", "Dale - Ready for his Shot"]
            },
            {
                "title": "Insightful Analysis Loop",
                "description": "Combining card drawing effects with passive questing secures late game inevitability.",
                "cards": ["Gameplay Analysis", "Gain Powerful Insight"]
            }
        ],
        "mulligan_insights": [],
        "pivot_insights": []
    }
