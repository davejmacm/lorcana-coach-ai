import os
import json
import sys
from google import genai
from google.genai import types

# Resolve paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from tools.fetch_current_lorcana_meta import fetch_current_lorcana_meta

def get_deck_analysis_enrichment(snapshot: dict) -> dict:
    """Uses Gemini 2.5 Flash to generate strategic tags, positioning analysis, and coaching directives.

    Args:
        snapshot: The pre-computed deck snapshot dictionary.

    Returns:
        A dictionary containing:
          - tags: list of strings
          - meta_win_rate: string (e.g. '53.2%')
          - meta_performance_breakdown: string
          - coaching_directives: list of dicts with keys 'type', 'icon', 'instruction'
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

Your task is to enrich the personal snapshot with high-quality strategic advice. You MUST return a JSON object with the following fields:
1. "tags": A list of 2 or 3 strategic tags defining the deck style (e.g., ["Control", "Draw", "Late Game"], ["Aggro", "Rush"], ["Midrange", "Tempo"]).
2. "meta_win_rate": A string representing the average win rate of this archetype in the current competitive meta (e.g., "53.4%"). Use the metagame data to estimate this color pair's average win rate, or estimate based on common tiers.
3. "meta_performance_breakdown": A professional, encouraging, yet highly strategic 2-3 sentence summary of how this deck combination matches up against the current metagame.
4. "coaching_directives": A list of exactly 3 actionable improvements the player should make. Each must be a dictionary containing:
   - "type": category (e.g. "Early Game Adjustment", "Pivot Moment", "Inkwell Habit")
   - "icon": one of: "shuffle", "activity", "target", "shield", "sword"
   - "instruction": A concise 1-sentence tactical tip recommending specific cards or play patterns.

Return ONLY a raw JSON object matching the schema. No markdown block wrapping, no ```json, just the pure JSON.
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
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
        ]
    }
