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
from tools.match_coach import generate_match_coaching, generate_pivot_only
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

# Load Lorcana Cards Database
CARDS_DB = {}
try:
    cards_path = os.path.join(PROJECT_ROOT, "lorcana_cards.json")
    if os.path.exists(cards_path):
        with open(cards_path, "r", encoding="utf-8") as f:
            CARDS_DB = json.load(f)
        logger.info("Loaded %d Lorcana cards from database.", len(CARDS_DB))
    else:
        logger.warning("lorcana_cards.json not found in project root.")
except Exception as e:
    logger.error("Failed to load lorcana_cards.json: %s", e)


def find_card_by_name(name: str) -> dict | None:
    if not name:
        return None
    name_lower = name.strip().lower()
    
    # Try exact match first
    for cid, card in CARDS_DB.items():
        if card.get("name", "").strip().lower() == name_lower:
            return {"id": cid, **card}
            
    # Substring matching fallback
    for cid, card in CARDS_DB.items():
        cname = card.get("name", "").strip().lower()
        if name_lower in cname or cname in name_lower:
            return {"id": cid, **card}
            
    return None


def enrich_card_list(cards: list) -> list:
    """Enrich a list of card summaries with cost, ink, and digital image URL from CARDS_DB."""
    enriched = []
    for card in cards:
        if isinstance(card, str):
            # Parse string formatted like "**Captain Hook - Forceful Duelist** (1-174) ..."
            name = None
            cid = None
            if "**" in card:
                parts = card.split("**")
                if len(parts) >= 3:
                    name = parts[1].strip()
            
            # Extract set ID from parentheses, e.g. (1-174)
            import re
            match = re.search(r'\(([^)]+)\)', card)
            if match:
                cid = match.group(1).strip()
            
            card = {"name": name, "id": cid}

        if not isinstance(card, dict):
            continue
        cid = card.get("id")
        name = card.get("name")
        image_url = None
        cost = card.get("cost")
        ink = None
        
        if cid and cid in CARDS_DB:
            card_info = CARDS_DB[cid]
            image_url = card_info.get("image_uris", {}).get("digital", {}).get("normal")
            cost = card_info.get("cost", cost)
            ink = card_info.get("ink")
        elif name:
            card_info = find_card_by_name(name)
            if card_info:
                cid = card_info.get("id")
                image_url = card_info.get("image_uris", {}).get("digital", {}).get("normal")
                cost = card_info.get("cost", cost)
                ink = card_info.get("ink")
                
        enriched.append({
            "name": name,
            "id": cid,
            "cost": cost,
            "ink": ink,
            "image_url": image_url
        })
    return enriched


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
                    cached_data = json.load(f)
                    # Ignore the cached file if it was generated as a fallback
                    if ("key_synergies" in cached_data and 
                        "mulligan_insights" in cached_data and 
                        cached_data.get("token_usage", {}).get("note") != "fallback used"):
                        return JSONResponse(content=cached_data)
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

        # Resolve key synergies card details with set IDs and AVIF URLs
        synergies_raw = enrichment.get("key_synergies", [])
        enriched_synergies = []
        for syn in synergies_raw:
            cards_raw = syn.get("cards", [])
            resolved_cards = []
            for name in cards_raw:
                card_info = find_card_by_name(name)
                if card_info:
                    resolved_cards.append({
                        "name": card_info.get("name", name),
                        "id": card_info.get("id"),
                        "image_url": card_info.get("image_uris", {}).get("digital", {}).get("normal"),
                        "cost": card_info.get("cost"),
                        "ink": card_info.get("ink")
                    })
                else:
                    resolved_cards.append({
                        "name": name,
                        "id": None,
                        "image_url": None,
                        "cost": None,
                        "ink": None
                    })
            enriched_synergies.append({
                "title": syn.get("title", "Synergy Combo"),
                "description": syn.get("description", ""),
                "cards": resolved_cards
            })

        payload = {
            "deck_id": deck_id,
            "deck_name": f"{deck_colors} ({deck_format.capitalize()})" if deck_format else deck_colors,
            "tags": enrichment.get("tags", []),
            "top_improvement": enrichment.get("top_improvement", "Increase early game consistency."),
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
            "key_synergies": enriched_synergies,
            "win_condition_timeline": {
                "early": { "label": "Early (Turns 1-6)", "percentage": early_pct },
                "mid": { "label": "Mid (Turns 7-10)", "percentage": mid_pct },
                "late": { "label": "Late (Turns 11+)", "percentage": late_pct }
            },
            "mulligan_insights": enrichment.get("mulligan_insights", []),
            "pivot_insights": enrichment.get("pivot_insights", []),
            "token_usage": enrichment.get("token_usage", {})
        }

        # Cache the enriched analysis payload only if it is not a fallback/degraded payload
        if enrichment.get("token_usage", {}).get("note") != "fallback used":
            try:
                os.makedirs(os.path.dirname(cached_analysis_path), exist_ok=True)
                with open(cached_analysis_path, "w", encoding="utf-8") as f:
                    json.dump(payload, f, indent=2)
                logger.info("Successfully cached enriched deck analysis: %s", deck_id)
            except Exception as cache_exc:
                logger.warning("Could not cache enriched deck analysis: %s", cache_exc)
        else:
            logger.info("Bypassed caching for fallback deck analysis: %s", deck_id)

        return JSONResponse(content=payload)

    except Exception as exc:
        logger.exception("Enrichment failed for %s", deck_colors)
        raise HTTPException(
            status_code=500,
            detail=f"Deck analysis enrichment failed: {exc}",
        ) from exc


def enrich_mulligan_payload(payload: dict) -> dict:
    """Ensure all card references in mulligan analysis are fully enriched with details & image URLs."""
    if "mulligan_analysis" in payload and "cards_details" in payload["mulligan_analysis"]:
        details = payload["mulligan_analysis"]["cards_details"]
        for key in ["initial_hand", "mulliganed", "drawn"]:
            if key in details and isinstance(details[key], list):
                details[key] = enrich_card_list(details[key])
    return payload


def is_coaching_payload_degraded(payload: dict) -> bool:
    """Detect if a cached coaching payload is a fallback/empty state."""
    if not payload:
        return True
    
    # Check for master error fallback marker
    if payload.get("token_usage", {}).get("note") == "master error fallback used":
        return True
        
    # Check if key sections are missing or empty
    mulligan = payload.get("mulligan_analysis", {})
    if not mulligan or mulligan.get("coach_verdict") in [None, "No verdict available.", ""]:
        return True
        
    if not payload.get("takeaways"):
        return True
        
    # Check for specific fallback strings in verdict
    verdict = mulligan.get("coach_verdict", "")
    if "You made reasonable mulligan decisions" in verdict:
        return True
        
    # Check if execution_rating is missing
    if not mulligan.get("execution_rating"):
        return True
        
    return False


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

            if is_coaching_payload_degraded(payload):
                logger.info("Cached review for %s is degraded. Ignoring cache to trigger regeneration.", game_id)
            else:
                # Retroactively add execution_rating fallback for older cached files
                if "mulligan_analysis" in payload and "execution_rating" not in payload["mulligan_analysis"]:
                    payload["mulligan_analysis"]["execution_rating"] = "Optimal"
                    
                # If timeline is missing or we need to ensure the correct player is loaded
                if "timeline" not in payload or "your_deck_colors" not in payload.get("match_metadata", {}) or payload.get("match_metadata", {}).get("opponent_name") == "Opponent":
                    summary_path = os.path.join(cached_dir, f"{game_id}_summary.json")
                    timeline_path = os.path.join(cached_dir, f"{game_id}_timeline.md")
                    if os.path.exists(summary_path) and os.path.exists(timeline_path):
                        with open(summary_path, "r", encoding="utf-8") as sf:
                            summary = json.load(sf)
                        with open(timeline_path, "r", encoding="utf-8") as tf:
                            timeline = tf.read()
                        
                        payload["timeline"] = timeline
                        
                        # Fix player 1/2 bug retroactively
                        your_player_num = summary.get("match_metadata", {}).get("your_player", 1)
                        player_key = f"player_{your_player_num}"
                        player_data = summary.get("players", {}).get(player_key, {})
                        initial_hand = player_data.get("initial_hand", [])
                        mulligan_data = player_data.get("mulligan", {})
                        mulliganed = mulligan_data.get("mulliganed", [])
                        drawn = mulligan_data.get("drawn", [])
                        
                        if "mulligan_analysis" in payload:
                            payload["mulligan_analysis"]["cards_details"] = {
                                "initial_hand": initial_hand,
                                "mulliganed": mulliganed,
                                "drawn": drawn
                            }
                        
                        if "match_metadata" in payload:
                            payload["match_metadata"]["your_deck_colors"] = summary.get("match_metadata", {}).get("your_deck_colors", "")
                            payload["match_metadata"]["went_first"] = summary.get("match_metadata", {}).get("went_first", True)
                        
                        # Re-cache updated version
                        with open(review_path, "w", encoding="utf-8") as fh_out:
                            json.dump(payload, fh_out, indent=2)

                payload["cached"] = True
                # Signal pivot availability to the frontend for lazy-loading.
                # "ready" = pivot is stored in the cache file (frontend skips Phase 2 fetch)
                # "pending" = old cache file has no pivot_turn, frontend must call /coaching/pivot
                has_pivot = bool(payload.get("pivot_turn"))
                payload["pivot_status"] = "ready" if has_pivot else "pending"
                # Strip pivot_turn from the live response — frontend fetches it separately
                payload.pop("pivot_turn", None)
                payload = enrich_mulligan_payload(payload)
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
        coaching = await generate_match_coaching(game_id, summary, timeline)
    except Exception as exc:
        logger.exception("generate_match_coaching failed for %s", game_id)
        raise HTTPException(
            status_code=500,
            detail=f"AI coaching generation failed: {exc}",
        ) from exc

    # ------ 4. Extract Mulligan Details Deterministically ------
    your_player_num = summary.get("match_metadata", {}).get("your_player", 1)
    player_key = f"player_{your_player_num}"
    player_data = summary.get("players", {}).get(player_key, {})
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
        "timeline": timeline,
        "match_metadata": {
            "opponent_name": summary.get("match_metadata", {}).get("opp_display_name", "Opponent"),
            "result": "Victory" if summary.get("match_metadata", {}).get("result") == "win" else "Defeat",
            "turns": summary.get("match_metadata", {}).get("turns", 0),
            "deck_win_rate": deck_win_rate,
            "opponent_colors": summary.get("match_metadata", {}).get("opp_deck_colors", ""),
            "opponent_archetype": coaching.get("opponent_archetype", "Unknown Archetype"),
            "your_deck_colors": summary.get("match_metadata", {}).get("your_deck_colors", ""),
            "went_first": summary.get("match_metadata", {}).get("went_first", True)
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
        "takeaways": coaching.get("takeaways", ""),
        "cached": False,
        "pivot_status": "pending",
        "token_usage": coaching.get("token_usage", {})
    }

    # Inject rate limit indicators
    if coaching.get("rate_limit_exceeded") or coaching.get("daily_limit_exceeded"):
        payload["rate_limit_exceeded"] = coaching.get("rate_limit_exceeded", False)
        payload["daily_limit_exceeded"] = coaching.get("daily_limit_exceeded", False)

    # Enrich mulligan cards with actual detail maps & URLs
    payload = enrich_mulligan_payload(payload)

    # Save to cache if not rate-limited and not degraded
    is_degraded = bool(coaching.get("degraded_sections")) or coaching.get("token_usage", {}).get("note") == "master error fallback used"
    if not payload.get("rate_limit_exceeded") and not payload.get("daily_limit_exceeded") and not is_degraded:
        try:
            cache_payload = {**payload}
            # Preserve any pivot_turn already resolved (e.g. from gather) in cache
            if coaching.get("pivot_turn"):
                cache_payload["pivot_turn"] = coaching["pivot_turn"]
            with open(review_path, "w", encoding="utf-8") as fh:
                json.dump(cache_payload, fh, indent=2)
            logger.info("Saved coaching review to %s", review_path)
        except Exception as exc:
            logger.warning("Failed to cache coaching review: %s", exc)
    else:
        logger.info("Bypassed caching for rate limit or degraded response payload: %s (degraded=%s)", game_id, is_degraded)

    return JSONResponse(content=payload)


@app.get("/api/matches/{game_id}/coaching/pivot")
async def match_coaching_pivot(game_id: str, auth: Tuple[str, str] = Depends(get_auth)):
    """Return only the pivot_turn analysis for a single game.

    Designed for lazy-loading: the frontend fires this after the main coaching
    report has already rendered.  Checks a dedicated ``{game_id}_pivot.json``
    sidecar first, then falls back to the parent ``_coach_review.json``, and
    finally runs the pivot sub-agent on demand if neither cache exists.
    """
    token, player_id = auth

    cached_dir = os.path.join(PROJECT_ROOT, "cached_analyses", player_id)
    os.makedirs(cached_dir, exist_ok=True)
    pivot_path = os.path.join(cached_dir, f"{game_id}_pivot.json")
    timeline_structured_path = os.path.join(cached_dir, f"{game_id}_timeline_structured.json")
    review_path = os.path.join(cached_dir, f"{game_id}_coach_review.json")

    # ------ 1. Fast path: dedicated pivot sidecar ------
    if os.path.exists(pivot_path):
        try:
            with open(pivot_path, "r", encoding="utf-8") as fh:
                pivot_payload = json.load(fh)
            logger.info("Serving cached pivot for %s", game_id)
            return JSONResponse(content={"pivot_turn": pivot_payload, "cached": True})
        except Exception as exc:
            logger.warning("Failed to read pivot cache for %s: %s", game_id, exc)

    # ------ 2. Extract from existing full review cache ------
    if os.path.exists(review_path):
        try:
            with open(review_path, "r", encoding="utf-8") as fh:
                review = json.load(fh)
            if "pivot_turn" in review and review["pivot_turn"]:
                pt = review["pivot_turn"]
                # Persist sidecar so future reads hit the fast path
                with open(pivot_path, "w", encoding="utf-8") as fh:
                    json.dump(pt, fh, indent=2)
                logger.info("Extracted pivot from review cache for %s", game_id)
                return JSONResponse(content={"pivot_turn": pt, "cached": True})
        except Exception as exc:
            logger.warning("Failed to extract pivot from review for %s: %s", game_id, exc)

    # ------ 3. On-demand pivot generation ------
    summary_path = os.path.join(cached_dir, f"{game_id}_summary.json")
    timeline_path = os.path.join(cached_dir, f"{game_id}_timeline.md")

    if not os.path.exists(summary_path) or not os.path.exists(timeline_path):
        # Cached match data not available — parse it first
        try:
            raw = get_parsed_match_data(game_id, token=token, player_id=player_id)
            data = json.loads(raw)
            if "error" in data:
                raise HTTPException(status_code=502, detail=data["error"])
            summary = data.get("summary", {})
            timeline = data.get("timeline", "")
        except Exception as exc:
            logger.exception("get_parsed_match_data failed for pivot %s", game_id)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse match data for pivot analysis: {exc}",
            ) from exc
    else:
        try:
            with open(summary_path, "r", encoding="utf-8") as sf:
                summary = json.load(sf)
            with open(timeline_path, "r", encoding="utf-8") as tf:
                timeline = tf.read()
        except Exception as exc:
            logger.exception("Failed to load cached match files for pivot %s", game_id)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load cached match data: {exc}",
            ) from exc

    try:
        pivot_result = await generate_pivot_only(game_id, summary, timeline)
    except Exception as exc:
        logger.exception("generate_pivot_only failed for %s", game_id)
        raise HTTPException(
            status_code=500,
            detail=f"Pivot analysis generation failed: {exc}",
        ) from exc

    # Rate-limit short-circuit — do NOT cache
    if pivot_result.get("rate_limit_exceeded"):
        logger.info("Bypassed pivot caching due to rate limit for %s", game_id)
        return JSONResponse(content={
            "pivot_turn": pivot_result.get("pivot_turn", {}),
            "cached": False,
            "rate_limit_exceeded": True,
            "daily_limit_exceeded": pivot_result.get("daily_limit_exceeded", False)
        })

    pivot_turn = pivot_result.get("pivot_turn", {})
    structured_timeline = pivot_result.get("structured_timeline", [])

    # Persist pivot sidecar
    try:
        with open(pivot_path, "w", encoding="utf-8") as fh:
            json.dump(pivot_turn, fh, indent=2)
        logger.info("Saved pivot sidecar to %s", pivot_path)
    except Exception as exc:
        logger.warning("Failed to cache pivot sidecar for %s: %s", game_id, exc)

    # Persist structured timeline sidecar
    if structured_timeline:
        try:
            with open(timeline_structured_path, "w", encoding="utf-8") as fh:
                json.dump(structured_timeline, fh, indent=2)
            logger.info("Saved structured timeline sidecar to %s", timeline_structured_path)
        except Exception as exc:
            logger.warning("Failed to cache structured timeline for %s: %s", game_id, exc)

    return JSONResponse(content={"pivot_turn": pivot_turn, "cached": False})


@app.get("/api/matches/{game_id}/coaching/timeline")
async def match_coaching_timeline(game_id: str, auth: Tuple[str, str] = Depends(get_auth)):
    """Return the structured UI timeline JSON for a single game.

    Designed for lazy-loading: fires after the main coaching payload renders.
    3-tier lookup:
      1. Dedicated ``{game_id}_timeline_structured.json`` sidecar.
      2. Extract from ``{game_id}_coach_review.json`` if it embeds structured_timeline.
      3. On-demand: run ``generate_pivot_only()`` and extract the timeline.
    """
    token, player_id = auth

    cached_dir = os.path.join(PROJECT_ROOT, "cached_analyses", player_id)
    os.makedirs(cached_dir, exist_ok=True)
    timeline_structured_path = os.path.join(cached_dir, f"{game_id}_timeline_structured.json")
    pivot_path = os.path.join(cached_dir, f"{game_id}_pivot.json")
    review_path = os.path.join(cached_dir, f"{game_id}_coach_review.json")

    # ------ 1. Fast path: dedicated structured timeline sidecar ------
    if os.path.exists(timeline_structured_path):
        try:
            with open(timeline_structured_path, "r", encoding="utf-8") as fh:
                tl = json.load(fh)
            logger.info("Serving cached structured timeline for %s", game_id)
            return JSONResponse(content={"timeline": tl, "cached": True})
        except Exception as exc:
            logger.warning("Failed to read structured timeline cache for %s: %s", game_id, exc)

    # ------ 2. Extract from existing review cache if embedded ------
    if os.path.exists(review_path):
        try:
            with open(review_path, "r", encoding="utf-8") as fh:
                review = json.load(fh)
            if "structured_timeline" in review and review["structured_timeline"]:
                tl = review["structured_timeline"]
                with open(timeline_structured_path, "w", encoding="utf-8") as fh:
                    json.dump(tl, fh, indent=2)
                logger.info("Extracted structured timeline from review cache for %s", game_id)
                return JSONResponse(content={"timeline": tl, "cached": True})
        except Exception as exc:
            logger.warning("Failed to extract structured timeline from review for %s: %s", game_id, exc)

    # ------ 3. On-demand generation via pivot agent ------
    summary_path = os.path.join(cached_dir, f"{game_id}_summary.json")
    timeline_path = os.path.join(cached_dir, f"{game_id}_timeline.md")

    if not os.path.exists(summary_path) or not os.path.exists(timeline_path):
        try:
            raw = get_parsed_match_data(game_id, token=token, player_id=player_id)
            data = json.loads(raw)
            if "error" in data:
                raise HTTPException(status_code=502, detail=data["error"])
            summary = data.get("summary", {})
            timeline_md = data.get("timeline", "")
        except Exception as exc:
            logger.exception("get_parsed_match_data failed for timeline %s", game_id)
            raise HTTPException(status_code=500, detail=f"Failed to parse match data: {exc}") from exc
    else:
        try:
            with open(summary_path, "r", encoding="utf-8") as sf:
                summary = json.load(sf)
            with open(timeline_path, "r", encoding="utf-8") as tf:
                timeline_md = tf.read()
        except Exception as exc:
            logger.exception("Failed to load cached match files for timeline %s", game_id)
            raise HTTPException(status_code=500, detail=f"Failed to load cached match data: {exc}") from exc

    try:
        pivot_result = await generate_pivot_only(game_id, summary, timeline_md)
    except Exception as exc:
        logger.exception("generate_pivot_only failed for timeline %s", game_id)
        raise HTTPException(status_code=500, detail=f"Timeline generation failed: {exc}") from exc

    if pivot_result.get("rate_limit_exceeded"):
        return JSONResponse(content={
            "timeline": [],
            "cached": False,
            "rate_limit_exceeded": True,
            "daily_limit_exceeded": pivot_result.get("daily_limit_exceeded", False)
        })

    structured_timeline = pivot_result.get("structured_timeline", [])
    pivot_turn = pivot_result.get("pivot_turn", {})

    # Persist both sidecars
    if structured_timeline:
        try:
            with open(timeline_structured_path, "w", encoding="utf-8") as fh:
                json.dump(structured_timeline, fh, indent=2)
        except Exception as exc:
            logger.warning("Failed to cache structured timeline for %s: %s", game_id, exc)

    if pivot_turn and not os.path.exists(pivot_path):
        try:
            with open(pivot_path, "w", encoding="utf-8") as fh:
                json.dump(pivot_turn, fh, indent=2)
        except Exception as exc:
            logger.warning("Failed to cache pivot for %s: %s", game_id, exc)

    return JSONResponse(content={"timeline": structured_timeline, "cached": False})


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Lorcana Coach AI server on 0.0.0.0:8000 …")
    uvicorn.run(app, host="0.0.0.0", port=8000)
