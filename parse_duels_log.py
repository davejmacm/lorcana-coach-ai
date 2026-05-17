"""
Duels.ink game log parser.

Parses decompressed game log JSON into a human-readable markdown timeline
and a structured JSON summary. Supports BO1, BO3, Core, Infinity, and
Quick Play formats via optional metadata enrichment. Uses Lorcast API
to strongly type cards with inkability and cost.
"""
import json
import csv
import os

# Resolve project root directory
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_CATALOG_FILE = os.path.join(PROJECT_ROOT, "lorcana_cards.json")

# Global cache for the loaded catalog
_lorcana_catalog = None

def get_lorcast_card(card_id):
    """Fetches card data from the local Lorcana catalog."""
    global _lorcana_catalog
    
    if _lorcana_catalog is None:
        if os.path.exists(LOCAL_CATALOG_FILE):
            try:
                with open(LOCAL_CATALOG_FILE, "r", encoding="utf-8") as f:
                    _lorcana_catalog = json.load(f)
            except Exception as e:
                print("Error loading {}: {}".format(LOCAL_CATALOG_FILE, e))
                _lorcana_catalog = {}
        else:
            print("Warning: Local catalog not found at {}. Please run tools/seed_lorcana_cards.py.".format(LOCAL_CATALOG_FILE))
            _lorcana_catalog = {}

    if not card_id or "-" not in card_id:
        return None
        
    return _lorcana_catalog.get(card_id)

def format_card_string(card_name, card_id):
    """Formats a card string with inkability, cost, and keyword data if available."""
    details = get_lorcast_card(card_id)
    if details:
        ink_str = "Inkable" if details.get("inkwell") else "Uninkable"
        cost = details.get("cost", "?")
        keywords = details.get("keywords", [])
        kw_str = ", Keywords: {}".format(", ".join(keywords)) if keywords else ""
        return "**{}** ({}) [{}, Cost {}{}]".format(card_name, card_id, ink_str, cost, kw_str)
    return "**{}** ({})".format(card_name, card_id)


def load_player_names(csv_path=None, game_id=None):
    """Reads the CSV file to match game_id and fetch the opponent's display name."""
    if csv_path is None:
        csv_path = os.path.join(PROJECT_ROOT, "match-history.csv")

    player_names = {
        1: "Player 1 (You)",
        2: "Player 2 (Opponent)"
    }

    if not os.path.exists(csv_path):
        return player_names, {}

    match_meta = {}
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("game_id") == game_id:
                    opp_name = row.get("opp_display_name")
                    your_player = row.get("your_player")
                    
                    if your_player:
                        p_num = int(your_player)
                        opp_num = 2 if p_num == 1 else 1
                        
                        player_names[p_num] = "You (Player {})".format(p_num)
                        
                        if opp_name:
                            player_names[opp_num] = "{} (Player {})".format(opp_name, opp_num)
                        else:
                            player_names[opp_num] = "Opponent (Player {})".format(opp_num)
                    elif opp_name:
                        player_names[2] = opp_name

                    # Extract match metadata
                    match_meta = {
                        "your_player": int(your_player) if your_player else None,
                        "match_format": row.get("match_format", "bo1"),
                        "match_id": row.get("match_id", "") or None,
                        "match_game_number": int(row["match_game_number"]) if row.get("match_game_number") else None,
                        "queue_id": row.get("queue_id", ""),
                        "queue_name": row.get("queue_name", ""),
                        "ranked": row.get("ranked", "").lower() == "true",
                        "season_name": row.get("season_name", ""),
                        "started_at": row.get("started_at", ""),
                        "ended_at": row.get("ended_at", ""),
                        "duration_seconds": int(row["duration_seconds"]) if row.get("duration_seconds") else None,
                        "turns": int(row["turns"]) if row.get("turns") else None,
                        "result": row.get("result", ""),
                        "end_reason": row.get("end_reason", ""),
                        "went_first": row.get("went_first", "").lower() == "true",
                        "your_lore": int(row["your_lore"]) if row.get("your_lore") else None,
                        "opp_lore": int(row["opp_lore"]) if row.get("opp_lore") else None,
                        "mmr_before": int(row["mmr_before"]) if row.get("mmr_before") else None,
                        "mmr_after": int(row["mmr_after"]) if row.get("mmr_after") else None,
                        "mmr_delta": int(row["mmr_delta"]) if row.get("mmr_delta") else None,
                        "your_deck_colors": row.get("your_deck_colors", ""),
                        "opp_display_name": row.get("opp_display_name", ""),
                        "opp_deck_colors": row.get("opp_deck_colors", ""),
                    }

                    # Derive format_type from queue_id
                    queue_id = match_meta["queue_id"]
                    if "infinity" in queue_id:
                        match_meta["format_type"] = "infinity"
                    elif "quick-play" in queue_id:
                        match_meta["format_type"] = "quick_play"
                    else:
                        match_meta["format_type"] = "core"

                    break
    except Exception as e:
        print("Warning: could not parse player names from CSV:", e)

    return player_names, match_meta


def pre_filter_events(events):
    """Filter out duplicate CARD_ATTACK and CARD_REVEALED events in the log."""
    attack_instances = {}
    revealed_groups = {}

    for ev in events:
        t = ev.get("type")
        ev_id = ev.get("id")
        data = ev.get("data", {})

        if t == "CARD_ATTACK":
            instance_id = data.get("instanceId")
            if instance_id:
                if instance_id not in attack_instances:
                    attack_instances[instance_id] = []
                attack_instances[instance_id].append(ev)

        elif t == "CARD_REVEALED":
            card_id = data.get("cardId")
            turn = ev.get("turnNumber")
            p = ev.get("player")
            key = (card_id, turn, p)
            if key not in revealed_groups:
                revealed_groups[key] = []
            revealed_groups[key].append(ev)

    skipped_attack_ids = set()
    skipped_reveal_ids = set()

    # For attacks, if we have multiple, keep only the one containing resolution data
    for instance_id, evs in attack_instances.items():
        if len(evs) > 1:
            resolved = [e for e in evs if "defenderTotalDamage" in e.get("data", {})]
            unresolved = [e for e in evs if "defenderTotalDamage" not in e.get("data", {})]
            if resolved and unresolved:
                for u in unresolved:
                    skipped_attack_ids.add(u.get("id"))

    # For reveals, merge and keep the one with revealDestination if present
    for key, evs in revealed_groups.items():
        if len(evs) > 1:
            dest_evs = [e for e in evs if "revealDestination" in e.get("data", {})]
            if dest_evs:
                target_ev = dest_evs[0]
            else:
                target_ev = evs[0]

            for e in evs:
                if e.get("id") != target_ev.get("id"):
                    skipped_reveal_ids.add(e.get("id"))

    filtered = []
    for ev in events:
        ev_id = ev.get("id")
        if ev.get("type") == "CARD_ATTACK" and ev_id in skipped_attack_ids:
            continue
        if ev.get("type") == "CARD_REVEALED" and ev_id in skipped_reveal_ids:
            continue
        filtered.append(ev)

    return filtered


def parse_logs(log_path, csv_path=None, game_id=None):
    """Parse a decompressed game log into a markdown timeline and JSON summary."""
    if csv_path is None:
        csv_path = os.path.join(PROJECT_ROOT, "match-history.csv")

    with open(log_path, "r", encoding="utf-8") as f:
        raw_events = json.load(f)

    player_names, match_meta = load_player_names(csv_path, game_id)

    # Clean up duplicate events
    events = pre_filter_events(raw_events)

    # State tracking
    inkwell = {1: 0, 2: 0}
    lore = {1: 0, 2: 0}
    cards_played = {1: [], 2: []}
    cards_inked = {1: [], 2: []}
    initial_hands = {1: [], 2: []}
    mulligans = {1: {}, 2: {}}

    timeline = []
    current_turn = None
    active_player = None

    # Process game setup events first (INITIAL_HAND, MULLIGAN)
    setup_events = []
    gameplay_events = []

    for ev in events:
        t = ev.get("type")
        if t in ["INITIAL_HAND", "MULLIGAN"]:
            setup_events.append(ev)
        else:
            gameplay_events.append(ev)

    # Add format header if metadata is available
    if match_meta:
        fmt_label = match_meta.get("queue_name", "Unknown Format")
        fmt_type = match_meta.get("format_type", "")
        match_fmt = match_meta.get("match_format", "bo1").upper()
        game_num = match_meta.get("match_game_number")

        header_parts = ["# {} - {}".format(fmt_label, match_fmt)]
        if game_num:
            header_parts[0] += " (Game {})".format(game_num)
        timeline.append(header_parts[0])
        timeline.append("")

    # Process Setup
    timeline.append("## Match Setup")
    for ev in setup_events:
        p = ev.get("player")
        p_name = player_names.get(p, "Player {}".format(p))
        t = ev.get("type")
        data = ev.get("data", {})

        if t == "INITIAL_HAND":
            cards = data.get("initialHandCards", [])
            card_strs = [format_card_string(c['name'], c['id']) for c in cards]
            initial_hands[p] = card_strs
            timeline.append("- **{}** drew initial hand:".format(p_name))
            for c in card_strs:
                timeline.append("  - {}".format(c))

        elif t == "MULLIGAN":
            m_count = data.get("mulliganCount", 0)
            m_cards = [format_card_string(c['name'], c['id']) for c in data.get("mulliganedCards", [])]
            d_cards = [format_card_string(c['name'], c['id']) for c in data.get("drawnCards", [])]
            mulligans[p] = {
                "mulligan_count": m_count,
                "mulliganed": m_cards,
                "drawn": d_cards
            }
            timeline.append("- **{}** performed a mulligan of {} cards:".format(p_name, m_count))
            if m_cards:
                timeline.append("  - *Mulliganed:* " + ", ".join(m_cards))
            if d_cards:
                timeline.append("  - *Drawn:* " + ", ".join(d_cards))

    timeline.append("\n## Gameplay Timeline")

    for ev in gameplay_events:
        t = ev.get("type")
        p = ev.get("player")
        turn_num = ev.get("turnNumber")
        p_name = player_names.get(p, "Player {}".format(p))
        data = ev.get("data", {})

        if t == "GAME_START":
            timeline.append("\n### Game Started")

        elif t == "TURN_START":
            active_player = p
            p_name = player_names.get(p, "Player {}".format(p))

            # Print turn header
            timeline.append("\n### Round {} - {}'s Turn".format(turn_num, p_name))
            
            p1_short = "You" if "You" in player_names.get(1, "") else player_names.get(1, "Player 1").split(" ")[0]
            p2_short = "You" if "You" in player_names.get(2, "") else player_names.get(2, "Player 2").split(" ")[0]
            
            timeline.append("> **State:** [{} Lore: {} | Ink: {}] - [{} Lore: {} | Ink: {}]".format(
                p1_short, lore[1], inkwell[1], p2_short, lore[2], inkwell[2]
            ))

        elif t == "CARD_DRAWN":
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            if card_name:
                timeline.append("- **{}** drew card: {}".format(p_name, format_card_string(card_name, card_id)))
            else:
                timeline.append("- **{}** drew a card".format(p_name))

        elif t == "TURN_DRAW":
            pass

        elif t == "CARD_INKED":
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            inkwell[p] += 1
            cards_inked[p].append("{} ({})".format(card_name, card_id))
            timeline.append("- **{}** inked: {} (Inkwell: {})".format(p_name, format_card_string(card_name, card_id), inkwell[p]))

        elif t == "CARD_PLAYED":
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            cost = data.get("cardCost", 0)
            cards_played[p].append({
                "name": card_name,
                "id": card_id,
                "cost": cost,
                "turn": turn_num
            })
            timeline.append("- **{}** played: {}".format(p_name, format_card_string(card_name, card_id)))

        elif t == "CARD_QUEST":
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            gained = data.get("loreGained", 0)
            total = data.get("newLoreTotal", 0)
            lore[p] = total
            timeline.append("- **{}** quested with {} (+{} Lore, total: {})".format(p_name, format_card_string(card_name, card_id), gained, total))

        elif t == "CARD_ATTACK":
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            target_name = data.get("targetCardName")
            target_id = data.get("targetCardId")

            # Check if resolved data is present
            if "defenderTotalDamage" in data:
                dmg_to_def = data.get("actualDamageToDefender", 0)
                dmg_to_atk = data.get("actualDamageToAttacker", 0)
                def_banished = data.get("defenderBanished", False)
                atk_banished = data.get("attackerBanished", False)

                outcome_parts = []
                outcome_parts.append("dealt {} damage".format(dmg_to_def))
                outcome_parts.append("took {} damage".format(dmg_to_atk))
                if def_banished:
                    outcome_parts.append("**{} banished**".format(target_name))
                if atk_banished:
                    outcome_parts.append("**{} banished**".format(card_name))

                timeline.append("- **{}** challenged {} using {} - Outcome: {}".format(
                    p_name, format_card_string(target_name, target_id), format_card_string(card_name, card_id), ", ".join(outcome_parts)
                ))
            else:
                # Fallback for unresolved event (usually filtered out)
                timeline.append("- **{}** challenged {} using {}".format(
                    p_name, format_card_string(target_name, target_id), format_card_string(card_name, card_id)
                ))

        elif t == "DAMAGE_DEALT":
            dmg = data.get("damage", 0)
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            source_name = data.get("abilitySourceCardName")
            if source_name:
                timeline.append("- {} took **{}** damage from ability of **{}**".format(
                    format_card_string(card_name, card_id), dmg, source_name
                ))
            else:
                timeline.append("- {} took **{}** damage".format(
                    format_card_string(card_name, card_id), dmg
                ))

        elif t == "CARD_DESTROYED":
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            timeline.append("- {} was banished to the discard pile".format(format_card_string(card_name, card_id)))

        elif t == "ABILITY_TRIGGERED":
            ab_name = data.get("abilityName")
            source_card = data.get("abilitySourceCardName")
            source_id = data.get("abilitySourceCardId")
            desc = data.get("effectDescription")

            # Check if this is a lore gain ability
            keys = data.get("effectDescriptionKeys", [])
            for k_item in keys:
                if k_item.get("key") == "gainsLore":
                    params = k_item.get("params", {})
                    amount = params.get("amount", 0)
                    total = params.get("total", 0)
                    lore[p] = total

            desc_str = " ({})".format(desc) if desc else ""
            timeline.append("- **{}** triggered ability **{}** on {}{}".format(
                p_name, ab_name, format_card_string(source_card, source_id), desc_str
            ))

        elif t == "ABILITY_ACTIVATED":
            ab_name = data.get("abilityName")
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            timeline.append("- **{}** activated ability **{}** on {}".format(
                p_name, ab_name, format_card_string(card_name, card_id)
            ))

        elif t == "CARD_REVEALED":
            card_name = data.get("cardName")
            card_id = data.get("cardId")
            source = data.get("sourceAbilityName")
            dest = data.get("revealDestination")

            dest_str = ""
            if dest == "hand":
                dest_str = " (added to hand)"
            elif dest == "bottom":
                dest_str = " (put to bottom of deck)"
            elif dest:
                dest_str = " (moved to {})".format(dest)

            timeline.append("- {} was revealed via ability **{}**{}".format(
                format_card_string(card_name, card_id), source, dest_str
            ))

        elif t == "UNDO_REQUESTED":
            timeline.append("- **{}** requested an undo".format(p_name))

        elif t == "UNDO_ACCEPTED":
            timeline.append("- Undo request accepted")

        elif t == "GAME_CONCEDED":
            conceded_by = data.get("concededBy")
            conceding_player = player_names.get(conceded_by, "Player {}".format(conceded_by))
            timeline.append("\n**{}** conceded the game!".format(conceding_player))

        elif t == "GAME_END":
            winner = data.get("winner")
            winner_name = player_names.get(winner, "Player {}".format(winner))
            reason = data.get("victoryReason") or "unknown"
            timeline.append("\n## Match Over!")
            timeline.append("- **Winner:** {}".format(winner_name))
            timeline.append("- **Victory Reason:** {}".format(reason.capitalize()))
            
            p1_short = "You" if "You" in player_names.get(1, "") else player_names.get(1, "Player 1").split(" ")[0]
            p2_short = "You" if "You" in player_names.get(2, "") else player_names.get(2, "Player 2").split(" ")[0]
            
            timeline.append("- **Final Scores:** {}: {} Lore - {}: {} Lore".format(
                p1_short, lore[1], p2_short, lore[2]
            ))

    timeline_str = "\n".join(timeline)

    # Build structured JSON
    structured_data = {
        "game_id": game_id,
        "match_metadata": match_meta if match_meta else {
            "match_format": "bo1",
            "format_type": "unknown"
        },
        "players": {
            "player_1": {
                "name": player_names.get(1),
                "final_lore": lore[1],
                "final_ink": inkwell[1],
                "cards_inked": cards_inked[1],
                "cards_played": cards_played[1],
                "initial_hand": initial_hands.get(1, []),
                "mulligan": mulligans.get(1, {})
            },
            "player_2": {
                "name": player_names.get(2),
                "final_lore": lore[2],
                "final_ink": inkwell[2],
                "cards_inked": cards_inked[2],
                "cards_played": cards_played[2],
                "initial_hand": initial_hands.get(2, []),
                "mulligan": mulligans.get(2, {})
            }
        }
    }

    return timeline_str, structured_data


if __name__ == "__main__":
    # Quick test with the original sample game
    import gzip
    import shutil

    test_game_id = "019e3200-de01-74be-8897-57aeeffaccb0"
    gz_path = os.path.join(PROJECT_ROOT, "cached_logs", "{}.logs.gz".format(test_game_id))
    txt_path = os.path.join(PROJECT_ROOT, "cached_logs", "{}_log.txt".format(test_game_id))

    if os.path.exists(gz_path) and not os.path.exists(txt_path):
        with gzip.open(gz_path, 'rb') as f_in:
            with open(txt_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)

    if os.path.exists(txt_path):
        timeline, summary = parse_logs(txt_path, game_id=test_game_id)
        print("Timeline length:", len(timeline))
        print("Summary keys:", list(summary.keys()))
        print("Match metadata:", json.dumps(summary.get("match_metadata", {}), indent=2))
        print("\nTimeline Preview:\n" + timeline[:500])
    else:
        print("No test log file found at:", txt_path)
