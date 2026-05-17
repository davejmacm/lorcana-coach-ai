"""
ADK Tool: Get parsed match data for a specific game.

Downloads the game log if needed, parses it, caches the results,
and returns the timeline + summary as a JSON payload.
"""
import json
import os
import gzip
import shutil
import sys

# Ensure parent directory is in sys.path for importing project modules
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from parse_duels_log import parse_logs
from tools.download_game_log import download_game_log


def get_parsed_match_data(game_id: str) -> str:
    """Parses and retrieves match history logs for a specific Lorcana game ID.

    Downloads the log from Duels.ink if not cached locally, parses it into
    a human-readable timeline and structured summary, and caches the results.
    Returns cached results instantly if the game has already been analyzed.

    Args:
        game_id: The unique identifier of the game (e.g., '019e3200-de01-74be-8897-57aeeffaccb0').

    Returns:
        A JSON string containing 'timeline' (markdown), 'summary' (structured JSON),
        and 'cached' (boolean indicating if this was a cache hit).
    """
    print("[Tool] Running get_parsed_match_data for game_id: {}".format(game_id))

    # Set up paths
    cached_analyses_dir = os.path.join(PROJECT_ROOT, "cached_analyses")
    cached_logs_dir = os.path.join(PROJECT_ROOT, "cached_logs")
    os.makedirs(cached_analyses_dir, exist_ok=True)
    os.makedirs(cached_logs_dir, exist_ok=True)

    timeline_path = os.path.join(cached_analyses_dir, "{}_timeline.md".format(game_id))
    summary_path = os.path.join(cached_analyses_dir, "{}_summary.json".format(game_id))

    # ---- CACHE CHECK ----
    if os.path.exists(timeline_path) and os.path.exists(summary_path):
        print("[Tool] Cache hit! Loading pre-analyzed results for game_id: {}".format(game_id))
        try:
            with open(timeline_path, "r", encoding="utf-8") as f:
                timeline_content = f.read()
            with open(summary_path, "r", encoding="utf-8") as f:
                summary_content = json.load(f)

            payload = {
                "timeline": timeline_content,
                "summary": summary_content,
                "cached": True
            }
            return json.dumps(payload, indent=2)
        except Exception as e:
            print("[Tool] Cache read error, re-parsing: {}".format(e))

    # ---- DOWNLOAD LOG ----
    gz_path = download_game_log(game_id)
    if gz_path.startswith("ERROR"):
        return json.dumps({"error": gz_path})

    # ---- DECOMPRESS ----
    log_txt_path = os.path.join(cached_logs_dir, "{}_log.txt".format(game_id))
    if not os.path.exists(log_txt_path):
        try:
            with gzip.open(gz_path, 'rb') as f_in:
                with open(log_txt_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            print("[Tool] Decompressed to: {}".format(log_txt_path))
        except Exception as e:
            return json.dumps({"error": "Failed to decompress log: {}".format(str(e))})

    # ---- PARSE ----
    csv_path = os.path.join(PROJECT_ROOT, "match-history.csv")
    try:
        timeline_content, summary_content = parse_logs(
            log_path=log_txt_path,
            csv_path=csv_path,
            game_id=game_id
        )
    except Exception as e:
        return json.dumps({"error": "Failed to parse log: {}".format(str(e))})

    # ---- SAVE TO CACHE ----
    try:
        with open(timeline_path, "w", encoding="utf-8") as f:
            f.write(timeline_content)
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary_content, f, indent=2)
        print("[Tool] Cached analysis to: {}".format(cached_analyses_dir))
    except Exception as e:
        print("[Tool] Warning: Could not cache results: {}".format(e))

    payload = {
        "timeline": timeline_content,
        "summary": summary_content,
        "cached": False
    }

    return json.dumps(payload, indent=2)


if __name__ == "__main__":
    # Test standalone
    test_id = "019e3200-de01-74be-8897-57aeeffaccb0"
    res = get_parsed_match_data(test_id)
    data = json.loads(res)
    if "error" in data:
        print("ERROR:", data["error"])
    else:
        print("Timeline length:", len(data["timeline"]))
        print("Cached:", data["cached"])
        print("Match metadata:", json.dumps(data["summary"].get("match_metadata", {}), indent=2))
