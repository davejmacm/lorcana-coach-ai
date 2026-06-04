"""
Tool: Generate Deck Snapshot

Reads all *_summary.json files from a player's cached analyses directory,
filters them by deck color combination, and outputs a compact deck_snapshot.json
with aggregated statistics including win rate, card frequency, matchup records,
and tempo metrics.
"""

import json
import os
import re
import sys
from collections import Counter, defaultdict
from glob import glob

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


def _parse_inked_card(entry):
    """Normalise a cards_inked entry into {"name": str, "id": str, "turn": int|None}.

    Handles two formats:
      - New dict format:  {"name": "Pluto - Guard Dog", "id": "6-186", "turn": 1}
      - Old string format: "Pluto - Guard Dog (6-186)"

    Returns:
        dict with keys 'name', 'id', 'turn' (turn may be None for old format).
    """
    if isinstance(entry, dict):
        return {
            "name": entry.get("name", "Unknown"),
            "id": entry.get("id", ""),
            "turn": entry.get("turn"),
        }

    # Old string format: "Card Name (set-num)"
    match = re.match(r"^(.+?)\s*\((\d+-\d+)\)$", entry)
    if match:
        return {"name": match.group(1).strip(), "id": match.group(2), "turn": None}

    # Fallback – unrecognised format
    return {"name": str(entry), "id": "", "turn": None}


def _get_player_data(summary: dict) -> dict | None:
    """Return the player data dict that corresponds to 'your_player'.

    Args:
        summary: A fully-loaded summary JSON dict.

    Returns:
        The player sub-dict (e.g. summary["players"]["player_1"]), or None
        if the data is malformed.
    """
    your_player = summary.get("match_metadata", {}).get("your_player")
    if your_player is None:
        return None
    key = f"player_{your_player}"
    return summary.get("players", {}).get(key)


def _compute_ink_utilization_1_5(cards_played: list[dict]) -> float:
    """Compute early-game ink utilisation for turns 1-5.

    The theoretical maximum ink available across turns 1-5 is
    1 + 2 + 3 + 4 + 5 = 15.  We sum the costs of cards actually played
    on those turns and divide by 15.

    Args:
        cards_played: List of card-played dicts, each with 'cost' and 'turn'.

    Returns:
        A float between 0.0 and ~1.0+ (can exceed 1.0 with cost-reduction
        effects, though that is unusual).
    """
    max_ink = 15  # 1+2+3+4+5
    spent = sum(
        card.get("cost", 0)
        for card in cards_played
        if card.get("turn") is not None and card["turn"] <= 5
    )
    return round(spent / max_ink, 4) if max_ink > 0 else 0.0


def _classify_win_turn(turns: int) -> str:
    """Classify a win into early / mid / late based on the turn count.

    Args:
        turns: Total number of turns in the match.

    Returns:
        One of 'early_wins', 'mid_wins', 'late_wins'.
    """
    if turns <= 6:
        return "early_wins"
    elif turns <= 10:
        return "mid_wins"
    else:
        return "late_wins"


def generate_deck_snapshot(deck_colors: str, player_id: str = None, deck_format: str = None) -> dict:
    """Aggregate stats from cached match summaries for a specific deck colour pair.

    Scans all *_summary.json files in the appropriate cached_analyses directory,
    filters to matches where the player used ``deck_colors`` and optionally
    matches the specified ``deck_format``, and computes a comprehensive snapshot.

    Args:
        deck_colors: The deck colour combination to filter for, e.g.
            ``"Sapphire/Steel"``.  Matching is case-insensitive.
        player_id: Optional player identifier.  When provided, summaries are
            read from ``cached_analyses/{player_id}/`` and the snapshot is
            saved under that player's sub-directory.
        deck_format: Optional deck format to filter for (e.g. ``"core"`` or ``"infinity"``).

    Returns:
        A dict containing the snapshot.  If fewer than 3 matching matches are
        found, returns ``{"status": "need_more_data", "match_count": N}``.
    """
    # ---- Resolve directories ----
    if player_id:
        analyses_dir = os.path.join(PROJECT_ROOT, "cached_analyses", player_id)
    else:
        analyses_dir = os.path.join(PROJECT_ROOT, "cached_analyses")

    if not os.path.isdir(analyses_dir):
        print(f"[Snapshot] Analyses directory not found: {analyses_dir}")
        return {"status": "need_more_data", "match_count": 0}

    # ---- Collect matching summaries ----
    summary_files = glob(os.path.join(analyses_dir, "*_summary.json"))
    print(f"[Snapshot] Found {len(summary_files)} summary file(s) in {analyses_dir}")

    matches: list[dict] = []
    for path in summary_files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                summary = json.load(f)
        except (json.JSONDecodeError, OSError) as exc:
            print(f"[Snapshot] Skipping {os.path.basename(path)}: {exc}")
            continue

        meta = summary.get("match_metadata", {})
        if meta.get("your_deck_colors", "").lower() == deck_colors.lower():
            if deck_format:
                fmt_type = meta.get("format_type") or ("infinity" if "infinity" in meta.get("queue_id", "").lower() else "core")
                norm_fmt = "infinity" if str(fmt_type).lower() == "infinity" else "core"
                if norm_fmt != deck_format.lower():
                    continue
            matches.append(summary)

    match_count = len(matches)
    print(f"[Snapshot] {match_count} match(es) found for deck '{deck_colors}'")

    # ---- Cold-start guard ----
    if match_count < 3:
        return {"status": "need_more_data", "match_count": match_count}

    # ---- Aggregate statistics ----
    wins = 0
    losses = 0
    total_duration = 0
    total_turns = 0
    win_turn_dist = {"early_wins": 0, "mid_wins": 0, "late_wins": 0}
    ink_utils: list[float] = []

    # card_name -> set of match indices where it appeared
    cards_played_counter: Counter = Counter()
    cards_inked_counter: Counter = Counter()

    # Track (name, id) pairs so we can report the id alongside the name
    card_played_ids: dict[str, str] = {}
    card_inked_ids: dict[str, str] = {}

    matchup_records: dict[str, dict[str, int]] = defaultdict(lambda: {"wins": 0, "losses": 0})

    for idx, summary in enumerate(matches):
        meta = summary["match_metadata"]
        result = meta.get("result", "").lower()
        turns = meta.get("turns", 0)
        duration = meta.get("duration_seconds", 0)
        opp_colors = meta.get("opp_deck_colors", "Unknown")

        # Win / loss tracking
        is_win = result == "win"
        if is_win:
            wins += 1
            win_turn_dist[_classify_win_turn(turns)] += 1
        else:
            losses += 1

        total_duration += duration
        total_turns += turns

        # Matchup records
        if is_win:
            matchup_records[opp_colors]["wins"] += 1
        else:
            matchup_records[opp_colors]["losses"] += 1

        # Player-specific data
        player_data = _get_player_data(summary)
        if player_data is None:
            continue

        # Cards played
        cards_played = player_data.get("cards_played", [])
        seen_played: set[str] = set()
        for card in cards_played:
            name = card.get("name", "Unknown")
            card_id = card.get("id", "")
            if name not in seen_played:
                cards_played_counter[name] += 1
                card_played_ids[name] = card_id
                seen_played.add(name)

        # Ink utilisation (turns 1-5)
        ink_utils.append(_compute_ink_utilization_1_5(cards_played))

        # Cards inked (handle both old string and new dict formats)
        raw_inked = player_data.get("cards_inked", [])
        seen_inked: set[str] = set()
        for entry in raw_inked:
            parsed = _parse_inked_card(entry)
            name = parsed["name"]
            card_id = parsed["id"]
            if name not in seen_inked:
                cards_inked_counter[name] += 1
                card_inked_ids[name] = card_id
                seen_inked.add(name)

    # ---- Compute final metrics ----
    win_rate = round(wins / match_count, 4)
    avg_duration = int(total_duration / match_count)
    avg_turns = round(total_turns / match_count, 2)
    avg_ink_util = round(sum(ink_utils) / len(ink_utils), 4) if ink_utils else 0.0

    freq_threshold = 0.30

    frequent_played = sorted(
        [
            {
                "name": name,
                "id": card_played_ids.get(name, ""),
                "frequency": round(count / match_count, 4),
            }
            for name, count in cards_played_counter.items()
            if count / match_count > freq_threshold
        ],
        key=lambda x: x["frequency"],
        reverse=True,
    )

    frequent_inked = sorted(
        [
            {
                "name": name,
                "id": card_inked_ids.get(name, ""),
                "frequency": round(count / match_count, 4),
            }
            for name, count in cards_inked_counter.items()
            if count / match_count > freq_threshold
        ],
        key=lambda x: x["frequency"],
        reverse=True,
    )

    # ---- Build snapshot dict ----
    deck_id = deck_colors.lower().replace("/", "-")
    if deck_format:
        deck_id = f"{deck_id}-{deck_format.lower()}"

    snapshot = {
        "deck_id": deck_id,
        "deck_colors": deck_colors,
        "match_count": match_count,
        "win_rate": win_rate,
        "avg_duration_seconds": avg_duration,
        "avg_turns": avg_turns,
        "ink_utilization_1_5": avg_ink_util,
        "win_turns_distribution": win_turn_dist,
        "frequent_cards_played": frequent_played,
        "frequent_cards_inked": frequent_inked,
        "matchup_records": dict(matchup_records),
    }

    # ---- Persist to disk ----
    if player_id:
        snapshot_dir = os.path.join(
            PROJECT_ROOT, "cached_analyses", player_id, "deck_snapshots"
        )
    else:
        snapshot_dir = os.path.join(PROJECT_ROOT, "cached_analyses", "deck_snapshots")

    os.makedirs(snapshot_dir, exist_ok=True)
    snapshot_path = os.path.join(snapshot_dir, f"{deck_id}_snapshot.json")

    try:
        with open(snapshot_path, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2)
        print(f"[Snapshot] Saved snapshot to {snapshot_path}")
    except OSError as exc:
        print(f"[Snapshot] Warning: Could not save snapshot: {exc}")

    return snapshot


# ---------------------------------------------------------------------------
# CLI entry-point for quick testing
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    test_deck = "Sapphire/Steel"
    print(f"--- Generating deck snapshot for '{test_deck}' ---\n")
    result = generate_deck_snapshot(test_deck)
    print(json.dumps(result, indent=2))
