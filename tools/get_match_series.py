"""
ADK Tool: Get BO3 match series data.

Given a match_id or game_id, finds all games in the series from match-history.csv,
parses each game, and returns a consolidated series-level summary suitable for
cross-game trend analysis and UI rendering.
"""
import json
import csv
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from tools.get_parsed_match_data import get_parsed_match_data


def _load_csv_rows():
    """Load all rows from match-history.csv."""
    csv_path = os.path.join(PROJECT_ROOT, "match-history.csv")
    if not os.path.exists(csv_path):
        return []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def get_match_series(match_id: str = None, game_id: str = None) -> str:
    """Retrieves and parses all games in a BO3 match series.

    Provide either a match_id (shared across all games in the series) or a
    game_id (from any single game in the series). The tool will find the full
    series, download and parse each game, and return a consolidated summary.

    Args:
        match_id: The shared match_id for the BO3 series (e.g., '019e27b7-a3b7-7939-b5bd-c6e66b7d45bb').
        game_id: A game_id from any game within the series (used to look up the match_id).

    Returns:
        A JSON string with series-level summary and per-game details, suitable for UI rendering.
    """
    print("[Tool] Running get_match_series for match_id={}, game_id={}".format(match_id, game_id))

    rows = _load_csv_rows()
    if not rows:
        return json.dumps({"error": "match-history.csv not found or empty"})

    # Resolve match_id from game_id if needed
    if not match_id and game_id:
        for row in rows:
            if row.get("game_id") == game_id:
                match_id = row.get("match_id")
                if not match_id:
                    # This is a BO1 game, not part of a series
                    return json.dumps({
                        "error": "Game {} is a BO1 game and not part of a multi-game series. Use get_parsed_match_data instead.".format(game_id)
                    })
                break
        else:
            return json.dumps({"error": "game_id {} not found in match-history.csv".format(game_id)})

    if not match_id:
        return json.dumps({"error": "Either match_id or game_id must be provided"})

    # Find all games in this series
    series_rows = [r for r in rows if r.get("match_id") == match_id]
    if not series_rows:
        return json.dumps({"error": "No games found for match_id {}".format(match_id)})

    # Sort by match_game_number
    series_rows.sort(key=lambda r: int(r.get("match_game_number", 0)))

    # Calculate series result
    wins = sum(1 for r in series_rows if r.get("result") == "win")
    losses = sum(1 for r in series_rows if r.get("result") == "loss")
    if wins > losses:
        series_result = "win ({}-{})".format(wins, losses)
    elif losses > wins:
        series_result = "loss ({}-{})".format(wins, losses)
    else:
        series_result = "draw ({}-{})".format(wins, losses)

    # Get reference data from first game
    ref = series_rows[0]

    # Build per-game data
    games = []
    for row in series_rows:
        gid = row.get("game_id")
        game_num = int(row.get("match_game_number", 0))

        # Parse each game (will use cache if available)
        parsed_result = get_parsed_match_data(gid)
        parsed_data = json.loads(parsed_result)

        game_entry = {
            "game_number": game_num,
            "game_id": gid,
            "result": row.get("result", ""),
            "end_reason": row.get("end_reason", ""),
            "your_lore": int(row["your_lore"]) if row.get("your_lore") else None,
            "opp_lore": int(row["opp_lore"]) if row.get("opp_lore") else None,
            "turns": int(row["turns"]) if row.get("turns") else None,
            "duration_seconds": int(row["duration_seconds"]) if row.get("duration_seconds") else None,
            "went_first": row.get("went_first", "").lower() == "true",
            "your_deck_colors": row.get("your_deck_colors", ""),
            "opp_deck_colors": row.get("opp_deck_colors", ""),
        }

        if "error" not in parsed_data:
            game_entry["summary"] = parsed_data.get("summary", {})
            game_entry["timeline"] = parsed_data.get("timeline", "")
            game_entry["cached"] = parsed_data.get("cached", False)
        else:
            game_entry["parse_error"] = parsed_data["error"]

        games.append(game_entry)

    series_output = {
        "match_id": match_id,
        "format": ref.get("match_format", "bo3"),
        "queue_name": ref.get("queue_name", ""),
        "queue_id": ref.get("queue_id", ""),
        "opponent": ref.get("opp_display_name", "Unknown"),
        "your_deck_colors": ref.get("your_deck_colors", ""),
        "opp_deck_colors": ref.get("opp_deck_colors", ""),
        "series_result": series_result,
        "total_games": len(games),
        "games": games
    }

    return json.dumps(series_output, indent=2)


if __name__ == "__main__":
    # Test with the known BO3 series
    test_match_id = "019e27b7-a3b7-7939-b5bd-c6e66b7d45bb"
    result = get_match_series(match_id=test_match_id)
    data = json.loads(result)
    if "error" in data:
        print("ERROR:", data["error"])
    else:
        print("Series: {} vs {} - {}".format(
            data["your_deck_colors"], data["opponent"], data["series_result"]
        ))
        for g in data["games"]:
            print("  Game {}: {} ({}) - {} turns".format(
                g["game_number"], g["result"], g["end_reason"], g["turns"]
            ))
