import os
import json
import sys
import asyncio
import re
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

# Resolve paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from tools.fetch_current_lorcana_meta import fetch_current_lorcana_meta

# =====================================================================
# 1. Define Pydantic Schemas for Strict Gemini Schema Enforcement
# =====================================================================

class MulliganAnalysisSchema(BaseModel):
    mulligan_execution: str = Field(
        description="Rating: Must be exactly one of: 'Optimal', 'Suboptimal', or 'Mistake'"
    )
    mulligan_coach_verdict: str = Field(
        description="Strategic analysis of keeps/tosses in the matchup context. (2-3 sentences)"
    )

class StateSchema(BaseModel):
    lore: int = Field(description="Lore points at start of round")
    ink: int = Field(description="Inkwell count at start of round")

class PivotTurnSchema(BaseModel):
    round_number: int = Field(description="The round/turn number where momentum shifted")
    tag: str = Field(description="Short tag like 'BOARD WIPE', 'MISSED QUEST', 'MISTEP', 'GAME WINNER'")
    player_state: StateSchema = Field(description="Player state at start of turn")
    opponent_state: StateSchema = Field(description="Opponent state at start of turn")
    your_actions: str = Field(description="Actions the user performed on this turn (1 sentence)")
    momentum_shift: str = Field(
        description="2-sentence explanation of why momentum shifted. Explicitly distinguish between opponent plays versus user errors."
    )

class LeadCoachSchema(BaseModel):
    opponent_archetype: str = Field(
        description="Estimated competitive opponent archetype based on colors and played cards."
    )
    takeaways: str = Field(
        description="3 strategic takeaway bullet points for the player, formatted as a single markdown string."
    )

# =====================================================================
# Structured Timeline Schema (returned alongside Pivot Turn)
# =====================================================================

class ActionEntry(BaseModel):
    type: str = Field(
        description="Action type. Must be exactly one of: 'ink', 'play', 'challenge', 'wipe', 'win-condition'"
    )
    label: str = Field(description="Short human-readable label, e.g. 'Played Elsa - The Fifth Spirit'")

class StructuredTimelineEntry(BaseModel):
    round: int = Field(description="Round number from the game timeline")
    isPivotTurn: bool = Field(description="True for the single pivot/momentum-shift turn only")
    actions: List[ActionEntry] = Field(description="List of significant actions this round")
    aiInsight: str = Field(
        description="1-2 sentence strategic insight. Non-empty only on: the pivot turn, the final turn, and one other inflection point. Empty string '' for all other turns."
    )

class PivotAndTimelineSchema(BaseModel):
    round_number: int = Field(description="The round/turn number where momentum shifted")
    tag: str = Field(description="Short tag like 'BOARD WIPE', 'MISSED QUEST', 'MISSTEP', 'GAME WINNER'")
    player_state: StateSchema = Field(description="Player state at start of pivot turn")
    opponent_state: StateSchema = Field(description="Opponent state at start of pivot turn")
    your_actions: str = Field(description="Actions the user performed on the pivot turn (1 sentence)")
    momentum_shift: str = Field(
        description="2-sentence explanation of why momentum shifted on the pivot turn."
    )
    structured_timeline: List[StructuredTimelineEntry] = Field(
        description="Structured timeline array. Include ONLY rounds with significant actions (exclude pure draw-only turns). Mark exactly one round as isPivotTurn: true."
    )

# =====================================================================
# 2. Resilient Fallback Generators
# =====================================================================

def get_mulligan_fallback(result_win: bool) -> Dict[str, Any]:
    return {
        "mulligan_execution": "Optimal",
        "mulligan_coach_verdict": f"You made reasonable mulligan decisions. Tossing high-cost cards was a good call, giving you early game interaction in this {'win' if result_win else 'loss'}."
    }

def get_pivot_fallback(result_win: bool, final_turns: int) -> Dict[str, Any]:
    pivot_round = min(5, final_turns)
    return {
        "round_number": pivot_round,
        "tag": "MOMENTUM CHECK",
        "player_state": {"lore": 0, "ink": pivot_round},
        "opponent_state": {"lore": 0, "ink": pivot_round},
        "your_actions": "Played cards and set up board presence.",
        "momentum_shift": "This turn stabilized the board state and dictated the pacing of the mid-game."
    }

def get_lead_fallback(opp_colors: str) -> Dict[str, Any]:
    return {
        "opponent_archetype": f"{opp_colors} Deck",
        "takeaways": f"* Prioritize early board challenges to contest quest potential.\n* Be mindful of potential board-clearing effects on key turns.\n* Plan ink usage to maximize cards played per turn."
    }

# =====================================================================
# 3. Asynchronous Sub-Agent Run Tasks
# =====================================================================

async def run_mulligan_agent(
    client: genai.Client,
    player_data: dict,
    opp_colors: str,
    went_first: bool,
    format_type: str
) -> MulliganAnalysisSchema:
    initial_hand = player_data.get("initial_hand", [])
    mulligan_data = player_data.get("mulligan", {})
    mulliganed = mulligan_data.get("mulliganed", [])
    drawn = mulligan_data.get("drawn", [])

    prompt = f"""
You are the Lorcana Mulligan Coach. Analyze the player's opening hand and mulligan decisions in the context of their deck, the opponent's deck colors, the format, and whether they went first.

Match Context:
- Format: {format_type}
- Opponent Deck Colors: {opp_colors}
- Went First: {"Yes" if went_first else "No"}

Player's Mulligan Details:
- Initial Hand: {json.dumps(initial_hand, indent=2)}
- Discarded (Mulliganed): {json.dumps(mulliganed, indent=2)}
- Drawn (Replacements): {json.dumps(drawn, indent=2)}

Evaluate the mulligan execution:
1. "mulligan_execution": A rating string mapping to one of these three exact values: "Optimal", "Suboptimal", or "Mistake".
   - "Optimal": Player made appropriate keeps/tosses for their curve and the opponent matchup.
   - "Suboptimal": Playable hand, but missed minor matchup or curve efficiency choices.
   - "Mistake": Maintained highly expensive cards or threw away early curve plays.
2. "mulligan_coach_verdict": Analyze the player's mulligan decisions. Discuss the quality of their keeps/tosses in the context of the matchup. (2-3 sentences).

CRITICAL RULE: Focus ONLY on opening hand choices and early-game proactivity. Do not comment on late-game execution or plays.
PERSPECTIVE RULE: Always address the player directly in second person ("you kept", "your hand", "you chose to mulligan"). NEVER use first-person pronouns (I, me, my, mine). NEVER write as if you are the player."""
    response = await client.aio.models.generate_content(
        model='gemini-3.1-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=MulliganAnalysisSchema
        )
    )
    return MulliganAnalysisSchema.model_validate_json(response.text)

async def run_pivot_agent(
    client: genai.Client,
    timeline: str,
    result_win: bool,
    total_turns: int
) -> PivotAndTimelineSchema:
    prompt = f"""
You are the Lorcana Pivot Turn Analyst and Match Chronicler. Perform two tasks simultaneously:

TASK 1 — PIVOT TURN IDENTIFICATION:
Scan the turn-by-turn game timeline and pinpoint the single round where momentum shifted critically.

TASK 2 — STRUCTURED TIMELINE CONSTRUCTION:
Map every round with significant actions into a structured array. Filter out rounds where a player ONLY drew a card or passed — only include rounds that contain at least one meaningful play, challenge, ink, or ability.

Match Context:
- Result: {"Victory" if result_win else "Defeat"}
- Total Turns: {total_turns}

Game Timeline:
{timeline}

---
RETURN a single JSON object with ALL of these fields:

Pivot Turn fields (Task 1):
1. "round_number": The integer turn/round number of the pivot turn.
2. "tag": A short all-caps tag (e.g. "BOARD WIPE", "GAME WINNER", "MISSTEP", "LORE SURGE").
3. "player_state": {{"lore": int, "ink": int}} at the start of the pivot turn.
4. "opponent_state": {{"lore": int, "ink": int}} at the start of the pivot turn.
5. "your_actions": A brief sentence summarizing what the player did on the pivot turn.
6. "momentum_shift": A 2-sentence explanation of why this was the pivot turn and what the strategic impact was.

Structured Timeline field (Task 2):
7. "structured_timeline": An array of round objects. For each significant round include:
   - "round": integer round number
   - "isPivotTurn": true only for the round matching "round_number" above, false for all others
   - "actions": array of {{"type": string, "label": string}} where type is EXACTLY one of:
       * "ink" — player inked a card into their inkwell
       * "play" — player played a character/item/action card onto the field
       * "challenge" — a character challenged another character
       * "wipe" — a card or ability banished multiple opposing characters, or a single key threat was eliminated
       * "win-condition" — questing for lore that significantly advanced or won the game (5+ total lore gained this turn, or winning quest)
   - "aiInsight": a 1-2 sentence strategic insight string. Set this ONLY for:
       * The pivot turn (isPivotTurn: true) — must have a non-empty aiInsight
       * The final round of the match — must have a non-empty aiInsight
       * The ONE other round with the largest board-state swing (most lore gained in a single turn, OR a board wipe turn) — give it a non-empty aiInsight
       * ALL other rounds: set aiInsight to an empty string ""

CRITICAL RULES:
- Include ONLY rounds with meaningful actions. Skip rounds that are purely draw-then-pass.
- Do NOT attribute opponent-driven board swings as user errors in aiInsight.
- The "label" in actions should be concise and human-readable, e.g. "Played Elsa - The Fifth Spirit", "Challenged Palace Guard with Sven".
- Use "wipe" type when an ability or action eliminates 2+ characters, or when a key board threat is removed.
- Use "win-condition" type for questing actions on the turn the game ends or when a player reaches 15+ lore.
PERSPECTIVE RULE: Describe the player's actions in second person ("You played Elsa", "Your challenge removed the threat", "You quested with Christopher Robin"). Describe opponent actions in third person ("Your opponent quested for 3 lore", "Your opponent played Calhoun"). NEVER use first-person pronouns (I, me, my). Do NOT narrate as if you are the player."""
    response = await client.aio.models.generate_content(
        model='gemini-3.1-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PivotAndTimelineSchema
        )
    )
    return PivotAndTimelineSchema.model_validate_json(response.text)

async def run_lead_agent(
    client: genai.Client,
    summary_meta: dict,
    timeline: str,
    meta_data: dict
) -> LeadCoachSchema:
    prompt = f"""
You are the Lead Lorcana Coach. Synthesize the match summary and timeline to estimate the opponent's deck archetype and provide 3 actionable, high-impact strategic takeaways for the player to improve.

Match Summary:
{json.dumps(summary_meta, indent=2)}

Timeline:
{timeline}

Current Lorcana Metagame Standings:
{json.dumps(meta_data, indent=2)}

Analyze this game and return a JSON object containing:
1. "opponent_archetype": Estimate the specific competitive archetype name of the opponent's deck based on their colors and played cards (e.g. "Emerald/Steel Midrange", "Ruby/Amethyst Bounce"). Refer to the metagame list if applicable.
2. "takeaways": 3 bullet points of strategic takeaways and actionable recommendations for the player, formatted as a single markdown string.

Focus on overall matchup lessons, resource decisions, and general improvements.
PERSPECTIVE RULE: Address the player directly in all takeaways ("Consider prioritising...", "Your deck benefits from...", "Look to challenge early..."). NEVER use first-person pronouns (I, me, my)."""
    response = await client.aio.models.generate_content(
        model='gemini-3.1-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=LeadCoachSchema
        )
    )
    return LeadCoachSchema.model_validate_json(response.text)

def clean_timeline_for_prompt(timeline_md: str) -> str:
    """Removes set IDs and bracketed card attributes from the timeline to reduce token count and API latency."""
    if not timeline_md:
        return ""
    # Remove set ids like (1-174)
    cleaned = re.sub(r'\s*\(\d+-\d+\)', '', timeline_md)
    # Remove bracketed attributes like [Inkable, Cost 2, Keywords: Shift]
    cleaned = re.sub(r'\s*\[[^\]]+\]', '', cleaned)
    return cleaned

async def generate_match_coaching(game_id: str, summary: dict, timeline: str) -> dict:
    """Uses Gemini 2.5 Flash async parallel agents to generate a coaching review for a match.

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

    # 1. Metadata resolution
    meta = summary.get("match_metadata", {})
    result = meta.get("result", "unknown")
    result_win = (result.lower() == "win")
    total_turns = meta.get("turns", 0)
    opp_colors = meta.get("opp_deck_colors", "Unknown")
    went_first = meta.get("went_first", True)
    format_type = meta.get("format_type", "core")

    # Dynamic Player Resolution (Player 1/2 Bug Fix)
    your_player_num = meta.get("your_player", 1)
    player_key = f"player_{your_player_num}"
    player_data = summary.get("players", {}).get(player_key, {})

    try:
        # Load metagame standings from local cache (fast)
        meta_json = fetch_current_lorcana_meta()
        try:
            meta_data = json.loads(meta_json)
        except Exception:
            meta_data = {}

        client = genai.Client(api_key=api_key)

        # Optimize the timeline for model prompts to reduce token size and latency
        cleaned_timeline = clean_timeline_for_prompt(timeline)

        # Define individual tasks, each wrapped in wait_for with a 15.0s timeout network safety net
        t_mulligan = asyncio.wait_for(
            run_mulligan_agent(client, player_data, opp_colors, went_first, format_type),
            timeout=15.0
        )
        t_pivot = asyncio.wait_for(
            run_pivot_agent(client, cleaned_timeline, result_win, total_turns),
            timeout=15.0
        )
        t_lead = asyncio.wait_for(
            run_lead_agent(client, meta, cleaned_timeline, meta_data),
            timeout=15.0
        )

        # Execute parallel gather
        results = await asyncio.gather(t_mulligan, t_pivot, t_lead, return_exceptions=True)

        # Inspect results for rate limits BEFORE standard processing
        rate_limit_hit = False
        daily_limit_hit = False
        for res in results:
            if isinstance(res, Exception):
                err_str = str(res)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    rate_limit_hit = True
                if "DAILY_QUOTA_EXHAUSTED" in err_str or "DAILY_LIMIT" in err_str or "free_tier_requests" in err_str or "quota exceeded" in err_str.lower():
                    daily_limit_hit = True

        if rate_limit_hit or daily_limit_hit:
            print(f"[MatchCoach] Rate limit hit (daily={daily_limit_hit}) detected in sub-agents. Short-circuiting.")
            return {
                "rate_limit_exceeded": True,
                "daily_limit_exceeded": daily_limit_hit,
                "opponent_archetype": "Unknown Archetype",
                "mulligan_execution": "Optimal",
                "mulligan_coach_verdict": "🔮 The Inkwells are Cooling\n\nThe Great Illuminary has temporarily run low on magical ink. The archives are recharging—please wait a brief moment before exploring further match reviews.",
                "pivot_turn": {
                    "round_number": 5,
                    "tag": "MOMENTUM CHECK",
                    "player_state": {"lore": 0, "ink": 0},
                    "opponent_state": {"lore": 0, "ink": 0},
                    "your_actions": "Inkwells Cooling",
                    "momentum_shift": "The Great Illuminary has temporarily run low on magical ink."
                },
                "takeaways": "* 🔮 **The Inkwells are Cooling**\n\nThe Great Illuminary has temporarily run low on magical ink. The archives are recharging—please wait a brief moment before exploring further match reviews."
            }

        # ---- Sub-agent result parsing with degraded_sections tracking ----
        degraded_sections = []

        # Mulligan
        m_res = results[0]
        if isinstance(m_res, Exception):
            print(f"[MatchCoach] Mulligan Agent failed/timedout ({type(m_res).__name__}). Marking degraded.")
            degraded_sections.append("mulligan")
            mulligan_data = {"mulligan_execution": None, "mulligan_coach_verdict": None}
        else:
            mulligan_data = m_res.model_dump()

        # Pivot
        p_res = results[1]
        if isinstance(p_res, Exception):
            print(f"[MatchCoach] Pivot Agent failed/timedout ({type(p_res).__name__}). Marking degraded.")
            degraded_sections.append("pivot")
            pivot_data = None
            structured_timeline = []
        else:
            full_pivot = p_res.model_dump()
            structured_timeline = full_pivot.pop("structured_timeline", [])
            pivot_data = full_pivot

        # Lead
        l_res = results[2]
        if isinstance(l_res, Exception):
            print(f"[MatchCoach] Lead Agent failed/timedout ({type(l_res).__name__}). Marking degraded.")
            degraded_sections.append("takeaways")
            lead_data = {"opponent_archetype": None, "takeaways": None}
        else:
            lead_data = l_res.model_dump()

        coaching = {
            "opponent_archetype": lead_data.get("opponent_archetype"),
            "mulligan_execution": mulligan_data.get("mulligan_execution"),
            "mulligan_coach_verdict": mulligan_data.get("mulligan_coach_verdict"),
            "pivot_turn": pivot_data,
            "structured_timeline": structured_timeline,
            "takeaways": lead_data.get("takeaways"),
            "degraded_sections": degraded_sections,
            "token_usage": {"note": "async sub-agents success"}
        }

        return coaching

    except Exception as e:
        print(f"[MatchCoach] Error running Gemini parallel match coach: {e}")
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            is_daily = "DAILY_QUOTA_EXHAUSTED" in err_str or "DAILY_LIMIT" in err_str or "free_tier_requests" in err_str or "quota exceeded" in err_str.lower()
            return {
                "rate_limit_exceeded": True,
                "daily_limit_exceeded": is_daily,
                "opponent_archetype": None,
                "mulligan_execution": None,
                "mulligan_coach_verdict": None,
                "pivot_turn": None,
                "takeaways": None,
                "degraded_sections": ["mulligan", "pivot", "takeaways"]
            }
        fallback = _get_fallback_coaching(game_id, summary)
        fallback["token_usage"] = {"note": "master error fallback used"}
        return fallback

async def generate_pivot_only(game_id: str, summary: dict, timeline: str) -> dict:
    """Runs only the Pivot Turn sub-agent and returns a dict with:
    - ``pivot_turn``: fields matching PivotTurnSchema
    - ``structured_timeline``: the UI-ready structured timeline array
    - Optional ``rate_limit_exceeded`` / ``daily_limit_exceeded`` booleans.

    Used by the /api/matches/{game_id}/coaching/pivot sidecar endpoint.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[PivotAgent] Warning: GEMINI_API_KEY not set. Using fallback.")
        meta = summary.get("match_metadata", {})
        result_win = meta.get("result", "").lower() == "win"
        total_turns = meta.get("turns", 0)
        return {"pivot_turn": get_pivot_fallback(result_win, total_turns), "structured_timeline": []}

    meta = summary.get("match_metadata", {})
    result_win = meta.get("result", "").lower() == "win"
    total_turns = meta.get("turns", 0)

    try:
        client = genai.Client(api_key=api_key)
        cleaned_timeline = clean_timeline_for_prompt(timeline)

        # Increased to 10s — the combined pivot+timeline response is larger
        pivot_result = await asyncio.wait_for(
            run_pivot_agent(client, cleaned_timeline, result_win, total_turns),
            timeout=10.0
        )
        full = pivot_result.model_dump()
        structured_timeline = full.pop("structured_timeline", [])
        return {"pivot_turn": full, "structured_timeline": structured_timeline}

    except Exception as e:
        err_str = str(e)
        print(f"[PivotAgent] Error running pivot agent for {game_id}: {e}")
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            is_daily = (
                "DAILY_QUOTA_EXHAUSTED" in err_str
                or "DAILY_LIMIT" in err_str
                or "free_tier_requests" in err_str
                or "quota exceeded" in err_str.lower()
            )
            return {
                "rate_limit_exceeded": True,
                "daily_limit_exceeded": is_daily,
                "pivot_turn": {
                    "round_number": 5,
                    "tag": "MOMENTUM CHECK",
                    "player_state": {"lore": 0, "ink": 0},
                    "opponent_state": {"lore": 0, "ink": 0},
                    "your_actions": "Inkwells Cooling",
                    "momentum_shift": "The Great Illuminary has temporarily run low on magical ink."
                },
                "structured_timeline": []
            }
        return {"pivot_turn": get_pivot_fallback(result_win, total_turns), "structured_timeline": []}


# Legacy synchronous fallback — returns honest null payload so caching is skipped
def _get_fallback_coaching(game_id: str, summary: dict) -> dict:
    """Returns a fully-degraded coaching payload with no fake insight text.

    All sections are marked as degraded so the frontend shows honest placeholders
    and the server skips caching, allowing retry on next visit.
    """
    return {
        "opponent_archetype": None,
        "mulligan_execution": None,
        "mulligan_coach_verdict": None,
        "pivot_turn": None,
        "structured_timeline": [],
        "takeaways": None,
        "degraded_sections": ["mulligan", "pivot", "takeaways"],
    }
