import os
import json
import sys
from google import genai
from google.genai import types

# Resolve paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from tools.fetch_current_lorcana_meta import fetch_current_lorcana_meta

def generate_match_coaching(game_id: str, summary: dict, timeline: str) -> dict:
    """Uses Gemini 2.5 Flash to generate a structured coaching review for a match.

    Args:
        game_id: The match game ID.
        summary: The parsed match summary dictionary.
        timeline: The parsed match timeline markdown string.

    Returns:
        A dictionary containing structured coaching fields.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[MatchCoach] Warning: GEMINI_API_KEY is not set. Using fallback mock coaching.")
        return _get_fallback_coaching(game_id, summary)

    try:
        # Fetch current meta for archetype matching
        meta_json = fetch_current_lorcana_meta()
        try:
            meta_data = json.loads(meta_json)
        except Exception:
            meta_data = {}

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are the Lead Lorcana Coach. Your role is to provide a master-class coaching review for a Disney Lorcana match.

Here is the parsed match summary and turn-by-turn timeline:
Match Summary:
{json.dumps(summary.get("match_metadata", {}), indent=2)}

Player Actions & Mulligan Data:
{json.dumps(summary.get("players", {}).get("player_1", {}), indent=2)}

Match Timeline:
{timeline}

Current Lorcana Metagame:
{json.dumps(meta_data, indent=2)}

Analyze this game and return a JSON object with the following fields:
1. "opponent_archetype": Estimate the specific competitive archetype name of the opponent's deck based on their colors and played cards (e.g. "Emerald/Steel Midrange", "Ruby/Amethyst Bounce"). Refer to the metagame list if applicable.
2. "mulligan_execution": A rating string mapping to one of these three exact values: "Optimal", "Suboptimal", or "Mistake".
   - "Optimal": Player made appropriate keeps/tosses for their curve and the opponent matchup.
   - "Suboptimal": Playable hand, but missed minor matchup or curve efficiency choices.
   - "Mistake": Maintained highly expensive cards or threw away early curve plays.
3. "mulligan_coach_verdict": Analyze the player's mulligan decisions. Discuss the quality of their keeps/tosses in the context of the matchup. (2-3 sentences).
4. "pivot_turn": Spot the critical turn where momentum shifted. Return a JSON object with:
   - "round_number": The integer turn/round number (e.g., 5).
   - "tag": A short tag (e.g., "CRITICAL MOMENT", "MISTEP", "GAME WINNER").
   - "player_state": {{"lore": int, "ink": int}} at the start of that turn.
   - "opponent_state": {{"lore": int, "ink": int}} at the start of that turn.
   - "your_actions": A brief sentence summarizing what the player did on that turn.
   - "momentum_shift": A 2-sentence explanation of why this was the pivot turn and what the strategic impact was.
5. "takeaways": 3 bullet points of strategic takeaways and actionable recommendations for the player, formatted as a single markdown string.

Return ONLY the raw JSON object. No markdown block wrapping, no ```json, just the pure JSON.
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        coaching = json.loads(response.text)
        
        # Extract and log token usage
        token_usage = {}
        usage = getattr(response, "usage_metadata", None)
        if usage:
            token_usage = {
                "prompt_tokens": getattr(usage, "prompt_token_count", 0),
                "candidates_tokens": getattr(usage, "candidates_token_count", 0),
                "total_tokens": getattr(usage, "total_token_count", 0)
            }
            print(f"[MatchCoach] LLM success. Token usage: {token_usage}")
        else:
            print("[MatchCoach] LLM success. Token usage metadata not available.")
            
        coaching["token_usage"] = token_usage
        return coaching

    except Exception as e:
        print(f"[MatchCoach] Error running Gemini match coach: {e}")
        fallback = _get_fallback_coaching(game_id, summary)
        fallback["token_usage"] = {"prompt_tokens": 0, "candidates_tokens": 0, "total_tokens": 0, "note": "fallback used"}
        return fallback

def _get_fallback_coaching(game_id: str, summary: dict) -> dict:
    meta = summary.get("match_metadata", {})
    opp_colors = meta.get("opp_deck_colors", "Unknown")
    result = meta.get("result", "unknown")
    
    return {
        "opponent_archetype": f"{opp_colors} Midrange",
        "mulligan_execution": "Optimal",
        "mulligan_coach_verdict": f"You made reasonable mulligan decisions. Tossing high-cost cards was a good call, giving you early game interaction in this {'win' if result == 'win' else 'loss'}.",
        "pivot_turn": {
            "round_number": 5,
            "tag": "CRITICAL MOMENT",
            "player_state": {
                "lore": int(meta.get("your_lore", 0) // 2),
                "ink": 5
            },
            "opponent_state": {
                "lore": int(meta.get("opp_lore", 0) // 2),
                "ink": 5
            },
            "your_actions": "Played characters and set up board control.",
            "momentum_shift": "This turn stabilized the board state and dictated the pacing of the mid-game."
        },
        "takeaways": "* Prioritize early board challenges to contest opposing quest potential.\n* Be mindful of potential board-clearing effects on key turns.\n* Plan ink usage to maximize cards played per turn."
    }
