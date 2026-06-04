"""
Lorcana Coach AI – FastAPI Backend Server
==========================================

Serves the frontend with match history, deck analysis, and per-game coaching
data.  All endpoints require a Duels.ink bearer token in the Authorization
header (except /api/health).

CORS middleware is intentionally **not** added here.  During development the
Vite dev-server proxies /api requests to this backend, so cross-origin
headers are unnecessary.  In production, a reverse-proxy (e.g. Nginx)
should handle CORS if the frontend and backend are on different origins.
"""

import sys
import os
import json
import logging
import asyncio
from typing import Tuple

import requests as http_requests  # avoid shadowing FastAPI's Request
from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Path setup – make sure the project root is importable so we can reach the
# tools/ package and other local modules.
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

from tools.get_match_history import get_match_history
from tools.get_parsed_match_data import get_parsed_match_data
from tools.generate_deck_snapshot import generate_deck_snapshot
from tools.deck_metrics_analyst import get_deck_analysis_enrichment
from tools.match_coach import generate_match_coaching
from tools.context import current_token, current_player_id

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger("lorcana-server")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Lorcana Coach AI",
    version="0.1.0",
    description="Backend API for the Lorcana Coach AI dashboard.",
)

# ---------------------------------------------------------------------------
# Authentication helpers
# ---------------------------------------------------------------------------

# Simple in-memory cache:  token → player_id
_player_id_cache: dict[str, str] = {}


def get_player_id(token: str) -> str:
    """Resolve a Duels.ink bearer token to the player's unique ID.

    Calls ``https://duels.ink/api/me/match-history`` to fetch the CSV match history,
    then parses it to extract the ``your_user_id`` field from the first match.
    Caches the result so subsequent requests are instant.
    """
    if token in _player_id_cache:
        return _player_id_cache[token]

    try:
        # Fetch first row of match history to get the player's user ID from the CSV
        resp = http_requests.get(
            "https://duels.ink/api/me/match-history",
            params={"format": "csv", "source": "matchmaking", "limit": 1},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        resp.raise_for_status()
    except http_requests.RequestException as exc:
        logger.warning("Duels.ink /api/me/match-history call failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail="Failed to verify token with Duels.ink.",
        ) from exc

    # Parse the CSV to extract your_user_id
    import csv
    import io
    csv_data = resp.text
    try:
        f = io.StringIO(csv_data)
        reader = csv.DictReader(f)
        rows = list(reader)
        if rows and rows[0].get("your_user_id"):
            player_id = str(rows[0]["your_user_id"])
        else:
            # Fallback to a hash of the token if no match history exists yet
            import hashlib
            player_id = hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]
    except Exception as exc:
        logger.error("Failed to parse player ID from CSV: %s", exc)
        import hashlib
        player_id = hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]

    _player_id_cache[token] = player_id
    logger.info("Resolved token to player_id=%s", player_id)
    return player_id


async def get_auth(request: Request) -> Tuple[str, str]:
    """FastAPI dependency that extracts and validates the bearer token.

    Returns:
        A ``(token, player_id)`` tuple.

    Raises:
        HTTPException 401: If the header is missing or the token is invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected 'Bearer <token>'.",
        )

    token = auth_header[len("Bearer "):].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token.")

    player_id = get_player_id(token)
    current_token.set(token)
    current_player_id.set(player_id)
    return token, player_id


# ---------------------------------------------------------------------------
# Background sync task
# ---------------------------------------------------------------------------
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)


def sync_player_matches_sync(token: str, player_id: str):
    """Synchronously fetches and parses missing match logs in the background."""
    logger.info("Starting background sync for player_id=%s", player_id)
    
    csv_path = os.path.join(PROJECT_ROOT, "cached_analyses", player_id, "match-history.csv")
    if not os.path.exists(csv_path):
        logger.warning("No match history CSV found for player %s during sync", player_id)
        return
        
    import csv
    game_ids = []
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                gid = row.get("game_id")
                if gid:
                    game_ids.append(gid)
    except Exception as e:
        logger.error("Failed to read game IDs from CSV during sync: %s", e)
        return

    logger.info("Found %d total games in history. Checking cache...", len(game_ids))
    
    # Limit sync to the last 20 matches to conserve resources and avoid Duels.ink rate limits
    sync_limit = 20
    game_ids = game_ids[:sync_limit]
    
    cached_dir = os.path.join(PROJECT_ROOT, "cached_analyses", player_id)
    new_downloads = 0
    
    for gid in game_ids:
        summary_path = os.path.join(cached_dir, f"{gid}_summary.json")
        if not os.path.exists(summary_path):
            try:
                logger.info("Syncing missing game log: %s", gid)
                get_parsed_match_data(gid, token=token, player_id=player_id)
                new_downloads += 1
                import time
                time.sleep(1.0)
            except Exception as e:
                logger.error("Failed to sync game %s: %s", gid, e)
                
    logger.info("Background sync complete for player_id=%s. Parsed %d new logs.", player_id, new_downloads)


async def sync_player_matches_background(token: str, player_id: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, sync_player_matches_sync, token, player_id)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health_check():
    """Simple liveness probe – no auth required."""
    return {"status": "ok"}


@app.get("/api/decks")
async def list_decks(background_tasks: BackgroundTasks, auth: Tuple[str, str] = Depends(get_auth)):
    """Return per-deck win/loss summaries derived from the player's match history.

    Groups matches by ``your_deck_colors`` and calculates aggregate stats for
    each colour pair.
    """
    token, player_id = auth

    raw = get_match_history(token=token, player_id=player_id)
    
    # Enqueue background synchronization of missing match logs
    background_tasks.add_task(sync_player_matches_background, token, player_id)
    
    data = json.loads(raw)

    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"])

    matches = data.get("matches", [])

    # Group by deck colours and format type ---------------------------------
    groups: dict[tuple[str, str], dict] = {}
    for match in matches:
        colors_str = match.get("your_deck_colors", "").strip()
        if not colors_str:
            continue

        fmt_type = match.get("format_type", "core").lower()
        deck_format = "Infinity" if fmt_type == "infinity" else "Core"

        key = (colors_str, deck_format)
        if key not in groups:
            groups[key] = {"wins": 0, "losses": 0, "total": 0}

        groups[key]["total"] += 1
        if match.get("result") == "win":
            groups[key]["wins"] += 1
        elif match.get("result") == "loss":
            groups[key]["losses"] += 1

    # Build response list ---------------------------------------------------
    deck_summaries = []
    for (colors_str, deck_format), stats in sorted(groups.items()):
        colors = [c.strip() for c in colors_str.split("/")]
        deck_id = "-".join(c.lower() for c in colors)
        deck_id = f"{deck_id}-{deck_format.lower()}"
        name = f"{'/'.join(colors)} ({deck_format})"
        win_rate = (
            f"{stats['wins'] / stats['total'] * 100:.1f}%"
            if stats["total"] > 0
            else "0%"
        )

        deck_summaries.append(
            {
                "id": deck_id,
                "name": name,
                "colors": colors,
                "format": deck_format,
                "winRate": win_rate,
                "wins": stats["wins"],
                "losses": stats["losses"],
                "matches": stats["total"],
            }
        )

    # Sort by number of matches descending so most-played decks come first
    deck_summaries.sort(key=lambda d: d["matches"], reverse=True)

    return JSONResponse(content=deck_summaries)


@app.get("/api/matches")
async def list_matches(queue: str = "all", auth: Tuple[str, str] = Depends(get_auth)):
    """Return the player's full match history and stats."""
    token, player_id = auth
    try:
        raw = get_match_history(queue_filter=queue, token=token, player_id=player_id)
        data = json.loads(raw)
        if "error" in data:
            raise HTTPException(status_code=502, detail=data["error"])
        return JSONResponse(content=data)
    except Exception as exc:
        logger.exception("get_match_history failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/decks/{deck_id}/analysis")
async def deck_analysis(deck_id: str, auth: Tuple[str, str] = Depends(get_auth)):
    """Return an AI-generated snapshot / analysis for a specific deck.

    ``deck_id`` is the lowercased, hyphen-separated colour pair with format
    (e.g. ``ruby-amethyst-core``).
    """
    token, player_id = auth

    # Split the format suffix off deck_id
    parts = deck_id.split("-")
    if len(parts) > 1 and parts[-1].lower() in ["core", "infinity"]:
        deck_format = parts[-1].lower()
        colors_parts = parts[:-1]
    else:
        deck_format = None
        colors_parts = parts

    deck_colors = "/".join(part.capitalize() for part in colors_parts)

    try:
        snapshot = generate_deck_snapshot(deck_colors, player_id, deck_format)
    except Exception as exc:
        logger.exception("generate_deck_snapshot failed for %s", deck_colors)
        raise HTTPException(
            status_code=500,
            detail=f"Deck snapshot generation failed: {exc}",
        ) from exc

    # If the tool signals insufficient data, pass it through transparently.
    if snapshot.get("status") == "need_more_data":
        return JSONResponse(content=snapshot)

    # Otherwise, enrich with LLM insights
    try:
        cached_analysis_path = os.path.join(
            PROJECT_ROOT, "cached_analyses", player_id, "deck_snapshots", f"{deck_id}_analysis.json"
        )
        if os.path.exists(cached_analysis_path):
            try:
                with open(cached_analysis_path, "r", encoding="utf-8") as f:
                    return JSONResponse(content=json.load(f))
            except Exception as read_exc:
                logger.warning("Failed to read cached analysis file: %s", read_exc)

        enrichment = get_deck_analysis_enrichment(snapshot)

        # Calculate win_rate_delta
        try:
            p_wr = snapshot["win_rate"] * 100
            m_wr = float(enrichment.get("meta_win_rate", "50.0%").replace("%", "").strip())
            delta = p_wr - m_wr
            delta_str = f"{'+' if delta >= 0 else ''}{delta:.1f}%"
        except Exception:
            delta_str = "+0.0%"

        # Format duration
        duration_secs = snapshot.get("avg_duration_seconds", 0)
        minutes = duration_secs // 60
        seconds = duration_secs % 60
        duration_str = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"

        # Derive pacing_label
        win_dist = snapshot.get("win_turns_distribution", {})
        early = win_dist.get("early_wins", 0)
        mid = win_dist.get("mid_wins", 0)
        late = win_dist.get("late_wins", 0)
        total_wins = early + mid + late
        if total_wins > 0:
            early_pct = round(early / total_wins * 100)
            mid_pct = round(mid / total_wins * 100)
            late_pct = round(late / total_wins * 100)
        else:
            early_pct = mid_pct = late_pct = 0

        if early_pct >= mid_pct and early_pct >= late_pct:
            pacing_label = "Aggro Pacing"
        elif mid_pct >= early_pct and mid_pct >= late_pct:
            pacing_label = "Midrange Pacing"
        else:
            pacing_label = "Control Pacing"

        # Ink efficiency
        util_val = snapshot.get("ink_utilization_1_5", 0.0)
        util_pct_str = f"{util_val * 100:.0f}%"
        if util_val > 0.8:
            ink_rating = "High"
        elif util_val >= 0.5:
            ink_rating = "Medium"
        else:
            ink_rating = "Low"

        payload = {
            "deck_id": deck_id,
            "deck_name": f"{deck_colors} ({deck_format.capitalize()})" if deck_format else deck_colors,
            "tags": enrichment.get("tags", []),
            "metrics": {
                "personal_win_rate": f"{snapshot['win_rate'] * 100:.1f}%",
                "meta_win_rate": enrichment.get("meta_win_rate", "50.0%"),
                "win_rate_delta": delta_str,
                "avg_match_duration": duration_str,
                "pacing_label": pacing_label,
                "ink_efficiency": {
                    "rating": ink_rating,
                    "utilization_percentage": util_pct_str,
                    "label": f"{util_pct_str} Utilization Turn 1-5"
                }
            },
            "meta_performance_breakdown": enrichment.get("meta_performance_breakdown", ""),
            "coaching_directives": enrichment.get("coaching_directives", []),
            "win_condition_timeline": {
                "early": { "label": "Early (Turns 1-6)", "percentage": early_pct },
                "mid": { "label": "Mid (Turns 7-10)", "percentage": mid_pct },
                "late": { "label": "Late (Turns 11+)", "percentage": late_pct }
            },
            "token_usage": enrichment.get("token_usage", {})
        }

        # Cache the enriched analysis payload
        try:
            os.makedirs(os.path.dirname(cached_analysis_path), exist_ok=True)
            with open(cached_analysis_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as cache_exc:
            logger.warning("Could not cache enriched deck analysis: %s", cache_exc)

        return JSONResponse(content=payload)

    except Exception as exc:
        logger.exception("Enrichment failed for %s", deck_colors)
        raise HTTPException(
            status_code=500,
            detail=f"Deck analysis enrichment failed: {exc}",
        ) from exc


@app.get("/api/matches/{game_id}/coaching")
async def match_coaching(game_id: str, auth: Tuple[str, str] = Depends(get_auth)):
    """Return coaching analysis for a single game.

    Checks for a cached structured coaching JSON first. If none exists,
    parses the match log and runs the coaching generator.
    """
    token, player_id = auth

    cached_dir = os.path.join(PROJECT_ROOT, "cached_analyses", player_id)
    os.makedirs(cached_dir, exist_ok=True)
    review_path = os.path.join(cached_dir, f"{game_id}_coach_review.json")

    # ------ 1. Check for cached coaching review JSON ------
    if os.path.exists(review_path):
        try:
            with open(review_path, "r", encoding="utf-8") as fh:
                payload = json.load(fh)
            
            # Retroactively add execution_rating fallback for older cached files
            if "mulligan_analysis" in payload and "execution_rating" not in payload["mulligan_analysis"]:
                payload["mulligan_analysis"]["execution_rating"] = "Optimal"
                
            payload["cached"] = True
            return JSONResponse(content=payload)
        except Exception as exc:
            logger.warning("Failed to read cached review for %s: %s", game_id, exc)

    # ------ 2. No cached review – parse match data first ------
    try:
        raw = get_parsed_match_data(game_id, token=token, player_id=player_id)
    except Exception as exc:
        logger.exception("get_parsed_match_data failed for %s", game_id)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse match data: {exc}",
        ) from exc

    data = json.loads(raw)
    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"])

    summary = data.get("summary", {})
    timeline = data.get("timeline", "")

    # ------ 3. Run LLM Coaching Review ------
    try:
        coaching = generate_match_coaching(game_id, summary, timeline)
    except Exception as exc:
        logger.exception("generate_match_coaching failed for %s", game_id)
        raise HTTPException(
            status_code=500,
            detail=f"AI coaching generation failed: {exc}",
        ) from exc

    # ------ 4. Extract Mulligan Details Deterministically ------
    player_data = summary.get("players", {}).get("player_1", {})
    initial_hand = player_data.get("initial_hand", [])
    mulligan_data = player_data.get("mulligan", {})
    mulliganed = mulligan_data.get("mulliganed", [])
    drawn = mulligan_data.get("drawn", [])

    # Get deck win rate (estimate or from decks list)
    deck_colors = summary.get("match_metadata", {}).get("your_deck_colors", "")
    deck_win_rate = "50%"
    try:
        raw_history = get_match_history(token=token, player_id=player_id)
        history_data = json.loads(raw_history)
        for match in history_data.get("matches", []):
            if match.get("your_deck_colors") == deck_colors:
                # We can just look up the stats or estimate
                pass
    except Exception:
        pass

    # Build final structured response
    payload = {
        "game_id": game_id,
        "match_metadata": {
            "opponent_name": summary.get("match_metadata", {}).get("opp_display_name", "Opponent"),
            "result": "Victory" if summary.get("match_metadata", {}).get("result") == "win" else "Defeat",
            "turns": summary.get("match_metadata", {}).get("turns", 0),
            "deck_win_rate": deck_win_rate,
            "opponent_colors": summary.get("match_metadata", {}).get("opp_deck_colors", ""),
            "opponent_archetype": coaching.get("opponent_archetype", "Unknown Archetype")
        },
        "mulligan_analysis": {
            "execution_rating": coaching.get("mulligan_execution", "Optimal"),
            "coach_verdict": coaching.get("mulligan_coach_verdict", "No verdict available."),
            "cards_details": {
                "initial_hand": initial_hand,
                "mulliganed": mulliganed,
                "drawn": drawn
            }
        },
        "pivot_turn": coaching.get("pivot_turn", {
            "round_number": 5,
            "tag": "CRITICAL MOMENT",
            "player_state": {"lore": 0, "ink": 0},
            "opponent_state": {"lore": 0, "ink": 0},
            "your_actions": "Played cards.",
            "momentum_shift": "No pivot turn details generated."
        }),
        "takeaways": coaching.get("takeaways", ""),
        "cached": False,
        "token_usage": coaching.get("token_usage", {})
    }

    # Save to cache
    try:
        with open(review_path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2)
        logger.info("Saved coaching review to %s", review_path)
    except Exception as exc:
        logger.warning("Failed to cache coaching review: %s", exc)

    return JSONResponse(content=payload)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Lorcana Coach AI server on 0.0.0.0:8000 …")
    uvicorn.run(app, host="0.0.0.0", port=8000)
