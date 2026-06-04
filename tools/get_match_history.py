"""
ADK Tool: Get match history.

Fetches the player's match history from the Duels.ink API, saves it locally,
and returns a UI-ready JSON structure with summary stats and per-game entries.
"""
import json
import csv
import os
import sys
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from tools.context import current_token, current_player_id

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


def refresh_match_history_csv(from_date=None, to_date=None, queue_filter=None, token=None, player_id=None):
    """Fetch match history from Duels.ink API and save to match-history.csv.

    Args:
        from_date: ISO date string for start range (default: 30 days ago).
        to_date: ISO date string for end range (default: now).
        queue_filter: Queue filter string (e.g., 'core-bo1,core-bo3,infinity-bo1').
                      If None, fetches all matchmaking queues.
        token: User's Duels.ink API token.
        player_id: Unique Player ID for sandboxed user caching.

    Returns:
        Path to the saved CSV file, or an error string.
    """
    if not player_id:
        player_id = current_player_id.get() or None

    if not token:
        token = current_token.get() or os.environ.get("DUELS_INK_TOKEN")
    if not token:
        return "ERROR: DUELS_INK_TOKEN not found in .env file or headers"

    # Build query parameters
    params = {
        "format": "csv",
        "source": "matchmaking",
    }

    if from_date:
        params["from"] = from_date
    else:
        # Default to 30 days ago
        from datetime import timedelta
        default_from = datetime.now(timezone.utc) - timedelta(days=30)
        params["from"] = default_from.strftime("%Y-%m-%dT%H:%M:%SZ")

    if to_date:
        params["to"] = to_date
    else:
        params["to"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if queue_filter:
        params["queue"] = queue_filter

    if player_id:
        target_dir = os.path.join(PROJECT_ROOT, "cached_analyses", player_id)
        os.makedirs(target_dir, exist_ok=True)
        csv_path = os.path.join(target_dir, "match-history.csv")
    else:
        csv_path = os.path.join(PROJECT_ROOT, "match-history.csv")
    all_content = ""
    header_saved = False

    try:
        while True:
            response = requests.get(
                "https://duels.ink/api/me/match-history",
                params=params,
                headers={"Authorization": "Bearer {}".format(token)},
                timeout=30
            )
            response.raise_for_status()
            content = response.text

            if not header_saved:
                all_content = content
                header_saved = True
            else:
                # Skip header line for subsequent pages
                lines = content.split("\n")
                if len(lines) > 1:
                    all_content += "\n".join(lines[1:])

            # Check for pagination cursor in Link header
            link_header = response.headers.get("Link", "")
            next_cursor = None
            if "next_cursor" in link_header:
                # Parse cursor from Link header
                import re
                cursor_match = re.search(r'cursor=([^&>\s]+)', link_header)
                if cursor_match:
                    next_cursor = cursor_match.group(1)

            if not next_cursor:
                break

            params["cursor"] = next_cursor

        with open(csv_path, "w", encoding="utf-8") as f:
            f.write(all_content)

        print("[MatchHistory] Saved to: {}".format(csv_path))
        return csv_path

    except Exception as e:
        return "ERROR: Failed to fetch match history: {}".format(str(e))


def get_match_history(from_date: str = None, to_date: str = None, queue_filter: str = "all", token: str = None, player_id: str = None) -> str:
    """Retrieves the player's match history as a UI-ready JSON structure.

    Refreshes the match-history.csv from the Duels.ink API, then parses it
    into a structured JSON list. Each entry includes metadata about whether
    a cached coaching analysis exists for that game.

    Args:
        from_date: Optional ISO date string for start of date range (e.g., '2026-05-01T00:00:00Z').
        to_date: Optional ISO date string for end of date range.
        queue_filter: Filter by queue type: 'core', 'infinity', 'quick_play', or 'all' (default).
        token: Optional user Duels.ink token.
        player_id: Optional unique Player ID for user sandbox isolation.

    Returns:
        A JSON string with total stats, summary, and a list of match entries.
    """
    if not player_id:
        player_id = current_player_id.get() or None
    if not token:
        token = current_token.get() or None

    print("[Tool] Running get_match_history (from={}, to={}, queue={}, player_id={})".format(from_date, to_date, queue_filter, player_id))

    # Always re-fetch from API
    result = refresh_match_history_csv(from_date=from_date, to_date=to_date, token=token, player_id=player_id)
    if isinstance(result, str) and result.startswith("ERROR"):
        return json.dumps({"error": result})

    # Load CSV
    if player_id:
        csv_path = os.path.join(PROJECT_ROOT, "cached_analyses", player_id, "match-history.csv")
        cached_analyses_dir = os.path.join(PROJECT_ROOT, "cached_analyses", player_id)
    else:
        csv_path = os.path.join(PROJECT_ROOT, "match-history.csv")
        cached_analyses_dir = os.path.join(PROJECT_ROOT, "cached_analyses")

    if not os.path.exists(csv_path):
        return json.dumps({"error": "match-history.csv not found"})

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Apply queue filter
    if queue_filter and queue_filter != "all":
        filtered_rows = []
        for r in rows:
            qid = r.get("queue_id", "")
            if queue_filter == "core" and ("core-bo1" in qid or "core-bo3" in qid):
                filtered_rows.append(r)
            elif queue_filter == "infinity" and "infinity" in qid:
                filtered_rows.append(r)
            elif queue_filter == "quick_play" and "quick-play" in qid:
                filtered_rows.append(r)
        rows = filtered_rows

    # Build summary
    wins = sum(1 for r in rows if r.get("result") == "win")
    losses = sum(1 for r in rows if r.get("result") == "loss")
    total = len(rows)
    win_rate = "{:.1f}%".format(wins / total * 100) if total > 0 else "0%"

    # Find date range
    dates = [r.get("started_at", "") for r in rows if r.get("started_at")]
    date_from = min(dates)[:10] if dates else ""
    date_to = max(dates)[:10] if dates else ""

    # Build match entries
    matches = []
    for r in rows:
        gid = r.get("game_id", "")

        # Check if analysis is cached
        is_cached = (
            os.path.exists(os.path.join(cached_analyses_dir, "{}_summary.json".format(gid))) and
            os.path.exists(os.path.join(cached_analyses_dir, "{}_timeline.md".format(gid)))
        )

        # Derive format_type
        qid = r.get("queue_id", "")
        if "infinity" in qid:
            format_type = "infinity"
        elif "quick-play" in qid:
            format_type = "quick_play"
        else:
            format_type = "core"

        entry = {
            "game_id": gid,
            "match_id": r.get("match_id") or None,
            "match_format": r.get("match_format", "bo1"),
            "match_game_number": int(r["match_game_number"]) if r.get("match_game_number") else None,
            "queue_name": r.get("queue_name", ""),
            "queue_id": qid,
            "format_type": format_type,
            "started_at": r.get("started_at", ""),
            "ended_at": r.get("ended_at", ""),
            "result": r.get("result", ""),
            "end_reason": r.get("end_reason", ""),
            "turns": int(r["turns"]) if r.get("turns") else None,
            "duration_seconds": int(r["duration_seconds"]) if r.get("duration_seconds") else None,
            "your_lore": int(r["your_lore"]) if r.get("your_lore") else None,
            "opp_lore": int(r["opp_lore"]) if r.get("opp_lore") else None,
            "your_deck_colors": r.get("your_deck_colors", ""),
            "opp_display_name": r.get("opp_display_name", ""),
            "opp_deck_colors": r.get("opp_deck_colors", ""),
            "mmr_before": int(r["mmr_before"]) if r.get("mmr_before") else None,
            "mmr_after": int(r["mmr_after"]) if r.get("mmr_after") else None,
            "mmr_delta": int(r["mmr_delta"]) if r.get("mmr_delta") else None,
            "ranked": r.get("ranked", "").lower() == "true",
            "is_cached": is_cached
        }
        matches.append(entry)

    output = {
        "total_games": total,
        "date_range": {"from": date_from, "to": date_to},
        "summary": {
            "wins": wins,
            "losses": losses,
            "win_rate": win_rate
        },
        "queue_filter_applied": queue_filter,
        "matches": matches
    }

    return json.dumps(output, indent=2)


if __name__ == "__main__":
    result = get_match_history()
    data = json.loads(result)
    if "error" in data:
        print("ERROR:", data["error"])
    else:
        print("Total games:", data["total_games"])
        print("Date range:", data["date_range"])
        print("Summary:", data["summary"])
        print("First 3 matches:")
        for m in data["matches"][:3]:
            print("  {} vs {} ({}) - {} [{}] cached={}".format(
                m["your_deck_colors"], m["opp_display_name"],
                m["opp_deck_colors"], m["result"],
                m["queue_name"], m["is_cached"]
            ))
