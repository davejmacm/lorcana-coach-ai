"""
Download game log files from Duels.ink API.

Downloads .logs.gz files for a given game_id and caches them locally
in the cached_logs/ directory to avoid redundant downloads.
"""
import os
import requests
from dotenv import load_dotenv
from tools.context import current_token, current_player_id

# Resolve project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


def download_game_log(game_id: str, token: str = None, player_id: str = None) -> str:
    """Downloads a game log (.logs.gz) from Duels.ink if not already cached.

    Args:
        game_id: The unique identifier of the game.
        token: Optional user bearer token.
        player_id: Optional unique Player ID for user sandbox cache isolation.

    Returns:
        The absolute file path to the cached .logs.gz file, or an error message string.
    """
    if not player_id:
        player_id = current_player_id.get() or None

    if player_id:
        cached_dir = os.path.join(PROJECT_ROOT, "cached_logs", player_id)
    else:
        cached_dir = os.path.join(PROJECT_ROOT, "cached_logs")
    os.makedirs(cached_dir, exist_ok=True)

    cached_path = os.path.join(cached_dir, "{}.logs.gz".format(game_id))

    # Check cache first
    if os.path.exists(cached_path) and os.path.getsize(cached_path) > 0:
        print("[Downloader] Cache hit: {}".format(cached_path))
        return cached_path

    # Download from API
    if not token:
        token = current_token.get() or os.environ.get("DUELS_INK_TOKEN")
    if not token:
        return "ERROR: DUELS_INK_TOKEN not found in .env file or headers"

    url = "https://duels.ink/g/{}".format(game_id)
    print("[Downloader] Downloading log from: {}".format(url))

    try:
        response = requests.get(
            url,
            headers={"Authorization": "Bearer {}".format(token)},
            allow_redirects=True,
            timeout=30
        )
        response.raise_for_status()

        with open(cached_path, "wb") as f:
            f.write(response.content)

        print("[Downloader] Saved to: {} ({} bytes)".format(cached_path, len(response.content)))
        return cached_path

    except requests.exceptions.HTTPError as e:
        return "ERROR: HTTP {} downloading log for game_id {}: {}".format(
            e.response.status_code, game_id, str(e)
        )
    except Exception as e:
        return "ERROR: Failed to download log for game_id {}: {}".format(game_id, str(e))


if __name__ == "__main__":
    test_id = "019e3200-de01-74be-8897-57aeeffaccb0"
    result = download_game_log(test_id)
    print("Result:", result)
