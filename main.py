"""
Lorcana Coach AI - Main Orchestrator

Multi-agent coaching system powered by Google ADK and Gemini.
Provides premium post-game analysis for Disney Lorcana matches
played on Duels.ink.
"""
import os
import sys
import asyncio
from dotenv import load_dotenv
from google import adk
from google.adk.sessions import InMemorySessionService

# Append current directory to path to ensure tool imports are found cleanly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environmental configurations from .env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

import json
try:
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "glossary_lorcana.json"), "r", encoding="utf-8") as _gf:
        lorcana_glossary_content = json.dumps(json.load(_gf), indent=2)
except Exception:
    lorcana_glossary_content = "{}"

# Verify Gemini API key is present
if not os.environ.get("GEMINI_API_KEY"):
    print("[Error] GEMINI_API_KEY is missing from your .env file!")
    print("Please add 'GEMINI_API_KEY=your_key' to .env to run the AI orchestrator.")
    sys.exit(1)

# Import the ADK-compatible tools
from tools.get_parsed_match_data import get_parsed_match_data
from tools.get_match_series import get_match_series
from tools.get_match_history import get_match_history
from tools.fetch_current_lorcana_meta import fetch_current_lorcana_meta

# Declare the Meta Specialist Sub-Agent
meta_specialist = adk.Agent(
    name="Meta_Specialist",
    model="gemini-2.5-flash",
    instruction=(
        "You are a Lorcana Meta Specialist. Your job is to analyze the competitive Disney Lorcana metagame "
        "and help the Lead Coach understand what archetypes the player's opponent might be running, and the key cards in those archetypes.\n"
        "When asked about the current metagame, you MUST use your fetch_current_lorcana_meta tool to get the live top 10 archetypes from Inkdecks.\n"
        "Compare any given opponent card cues, deck colors, or physical plays against this scraped data. Help identify the exact archetype and the remaining key threat cards the player must prepare for."
    ),
    tools=[fetch_current_lorcana_meta],
    sub_agents=[]
)

# Declare the Lead Coaching Agent (Master Orchestrator)
lead_coach = adk.Agent(
    name="Lead_Coach",
    model="gemini-2.5-flash",
    instruction=(
        f"You are the Lead Lorcana Coach. Your role is to provide a master-class, premium post-game review for a player using duels.ink game logs.\n\n"

        f"You must evaluate all game log interactions using the strict rules and tactical guidance found within lorcana_glossary.json. Pay special attention to keyword constraints (e.g., checking if Shifted or Rush cards acted legally and optimally) to ensure zero mechanical hallucinations when advising the user.\n\n"
        
        f"## Lorcana Glossary\n"
        f"{lorcana_glossary_content}\n\n"

        f"## Available Tools\n"
        f"- **get_parsed_match_data(game_id)**: Parse a single game log. Returns timeline (markdown) and summary (JSON) with match_metadata.\n"
        f"- **get_match_series(match_id, game_id)**: For BO3 matches, retrieves all games in a series. Provide either the match_id or any game_id from the series.\n"
        f"- **get_match_history(from_date, to_date, queue_filter)**: List recent matches. queue_filter can be 'core', 'infinity', 'quick_play', or 'all'.\n"
        f"- **Meta_Specialist sub-agent**: Has real-time access to the current Lorcana metagame standings and core cards.\n\n"

        f"## Workflow for Single Game (BO1) Analysis\n"
        f"1. Call get_parsed_match_data with the player's game ID.\n"
        f"2. Check match_metadata.format_type to understand the format context:\n"
        f"   - **core**: Standard constructed using Core + latest set. Limited card pool.\n"
        f"   - **infinity**: All sets are legal. Much wider card pool and different tier expectations.\n"
        f"   - **quick_play**: Unranked Core format for casual play.\n"
        f"3. Consult your Meta_Specialist to determine the opponent's deck archetype.\n"
        f"4. Perform rigorous strategic analysis.\n\n"

        f"## Workflow for BO3 Series Analysis\n"
        f"1. Call get_match_series with the match_id or game_id.\n"
        f"2. Analyze EACH game individually for its own merits.\n"
        f"3. Then synthesize cross-game trends:\n"
        f"   - How did the player adapt after winning or losing a game?\n"
        f"   - Did their mulligan strategy change between games?\n"
        f"   - Were there patterns in what the opponent adjusted?\n"
        f"   - Identify momentum shifts across the series.\n\n"

        f"## Analysis Structure\n"
        f"Your analysis MUST cover:\n"
        f"a. **Mulligan Phase Analysis**: Did the player keep the right cards? Give specific advice.\n"
        f"b. **Turn-by-Turn Momentum**: Spot the exact 'Pivot Turn' where momentum shifted and explain why.\n"
        f"c. **Format Context**: Adjust expectations based on whether this is Core, Infinity, or Quick Play.\n"
        f"d. **Ultimate Matchup Summary & Takeaways**: Provide actionable tactical adjustments.\n\n"

        f"Make sure your tone is professional, encouraging, premium, and highly analytical, structured in a beautiful Markdown format.\n"
        "Note: If the data comes back with 'cached: true', that means the log was already parsed before - this is normal and expected."
    ),
    tools=[get_parsed_match_data, get_match_series, get_match_history],
    sub_agents=[meta_specialist]
)

# Initialize the ADK Runner with InMemory Session support
runner = adk.Runner(
    agent=lead_coach,
    app_name="LorcanaCoach",
    session_service=InMemorySessionService()
)


async def run_coaching_session(game_id: str):
    cache_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cached_analyses", "{}_coach_review.md".format(game_id))
    if os.path.exists(cache_path):
        print("\n" + "="*80)
        print("  [COACH AI] LOADING CACHED ANALYSIS FOR GAME: {}".format(game_id))
        print("="*80)
        with open(cache_path, "r", encoding="utf-8") as f:
            print(f.read())
        print("\n" + "="*80)
        print("  [ANALYSIS COMPLETE] READY FOR NEXT GAME!")
        print("="*80 + "\n")
        return

    prompt = (
        "Analyze game {}. Retrieve the parsed match data, consult the Meta Specialist to identify the "
        "opponent's deck archetype from the current metagame, and perform a master-class coaching review "
        "covering mulligans, the pivot turn, and actionable match takeaways.".format(game_id)
    )

    print("\n" + "="*80)
    print("  [COACH AI] STARTING ANALYSIS FOR GAME: {}".format(game_id))
    print("="*80)
    print("[AI] Contacting Gemini and initializing log analysis flow...")
    print("[AI] Fetching log timelines and querying live metagame standings...")

    # Run the orchestrator loop asynchronously
    events = await runner.run_debug(prompt, quiet=True)

    print("\n" + "="*80)
    print("  [COACH'S PREMIUM MATCH REVIEW & STRATEGIC FEEDBACK]")
    print("="*80 + "\n")

    final_text = ""
    for ev in events:
        if hasattr(ev, "content") and ev.content:
            if ev.author == "Lead_Coach":
                for part in ev.content.parts:
                    if part.text:
                        final_text += part.text

    if final_text.strip():
        print(final_text.strip())
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(final_text.strip())
    else:
        # Fallback dump of any agent-generated dialogue text
        print("Warning: Standard response stream empty. Displaying model generation logs:")
        for ev in events:
            if hasattr(ev, "content") and ev.content:
                for part in ev.content.parts:
                    if part.text:
                        print("\n[{}]:\n{}".format(ev.author, part.text))

    print("\n" + "="*80)
    print("  [ANALYSIS COMPLETE] READY FOR NEXT GAME!")
    print("="*80 + "\n")


async def run_series_coaching(match_id: str):
    cache_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cached_analyses", "bo3_series_{}_coach_review.md".format(match_id))
    if os.path.exists(cache_path):
        print("\n" + "="*80)
        print("  [COACH AI] LOADING CACHED BO3 SERIES ANALYSIS: {}".format(match_id))
        print("="*80)
        with open(cache_path, "r", encoding="utf-8") as f:
            print(f.read())
        print("\n" + "="*80)
        print("  [SERIES ANALYSIS COMPLETE]")
        print("="*80 + "\n")
        return

    prompt = (
        "Analyze the BO3 match series with match_id '{}'. Use the get_match_series tool to retrieve all games. "
        "Consult the Meta Specialist to identify the opponent's deck archetype. "
        "Provide individual game analysis AND cross-game trend synthesis: "
        "how did the player adapt between games? What patterns emerged? "
        "Deliver a premium coaching review.".format(match_id)
    )

    print("\n" + "="*80)
    print("  [COACH AI] STARTING BO3 SERIES ANALYSIS: {}".format(match_id))
    print("="*80)
    print("[AI] Retrieving all games in the series...")

    events = await runner.run_debug(prompt, quiet=True)

    print("\n" + "="*80)
    print("  [COACH'S BO3 SERIES REVIEW & CROSS-GAME ANALYSIS]")
    print("="*80 + "\n")

    final_text = ""
    for ev in events:
        if hasattr(ev, "content") and ev.content:
            if ev.author == "Lead_Coach":
                for part in ev.content.parts:
                    if part.text:
                        final_text += part.text

    if final_text.strip():
        print(final_text.strip())
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(final_text.strip())
    else:
        for ev in events:
            if hasattr(ev, "content") and ev.content:
                for part in ev.content.parts:
                    if part.text:
                        print("\n[{}]:\n{}".format(ev.author, part.text))

    print("\n" + "="*80)
    print("  [SERIES ANALYSIS COMPLETE]")
    print("="*80 + "\n")


def print_banner():
    banner = """
================================================================================
 _____  _                                  _____                 _     ___  
|  __ \\| |                                / ____|               | |   |_  | 
| |__) | |  __ _  _   _   ___  _ __      | |      ___   __ _  ___| |__    | | 
|  ___/| | / _` || | | | / _ \\| '__|     | |     / _ \\ / _` |/ __| '_ \\   | | 
| |    | || (_| || |_| ||  __/| |        | |____| (_) | (_| | (__| | | |  | | 
|_|    |_| \\__,_| \\__, | \\___||_|         \\_____|\\___|\\___/ \\__,_|\\___|_| |_|  | | 
                   __/ |                                                 /_ | 
                  |___/                                                 |___| 
                     LORCANA COACH AI - COMPETITIVE METAGAME ANALYST
================================================================================
    """
    print(banner)


async def main_loop():
    print_banner()

    while True:
        print("Commands:")
        print("  [game_id]    - Analyze a single game (BO1 or individual BO3 game)")
        print("  bo3 [id]     - Analyze a full BO3 series (use match_id or any game_id)")
        print("  history      - Show recent match history")
        print("  exit/quit    - Close the program")
        print("")
        print("Press Enter for default test match: 019e3200-de01-74be-8897-57aeeffaccb0\n")

        try:
            user_input = input("Coach > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nShutting down Lorcana Coach AI...")
            break

        if user_input.lower() in ['exit', 'quit']:
            print("\nThank you for training with Lorcana Coach AI! Keep drawing, keep questing!")
            break

        if not user_input:
            game_id = "019e3200-de01-74be-8897-57aeeffaccb0"
            try:
                await run_coaching_session(game_id)
            except Exception as e:
                print("\n[ERROR] Error running analysis: {}\n".format(e))

        elif user_input.lower() == "history":
            print("\n[AI] Fetching match history from Duels.ink...\n")
            try:
                import json
                result = get_match_history()
                data = json.loads(result)
                if "error" in data:
                    print("[ERROR] {}".format(data["error"]))
                else:
                    print("Match History: {} games ({} to {})".format(
                        data["total_games"],
                        data["date_range"]["from"],
                        data["date_range"]["to"]
                    ))
                    print("Record: {} W / {} L ({})\n".format(
                        data["summary"]["wins"],
                        data["summary"]["losses"],
                        data["summary"]["win_rate"]
                    ))
                    for m in data["matches"][:20]:
                        cached_tag = " [CACHED]" if m["is_cached"] else ""
                        bo3_tag = " (Game {})".format(m["match_game_number"]) if m.get("match_game_number") else ""
                        print("  {} {} vs {} ({}) - {} ({}){}{}".format(
                            m["started_at"][:10],
                            m["your_deck_colors"],
                            m["opp_display_name"],
                            m["opp_deck_colors"],
                            m["result"].upper(),
                            m["queue_name"],
                            bo3_tag,
                            cached_tag
                        ))
                    if len(data["matches"]) > 20:
                        print("  ... and {} more games".format(len(data["matches"]) - 20))
                    print("")
            except Exception as e:
                print("\n[ERROR] Error fetching history: {}\n".format(e))

        elif user_input.lower().startswith("bo3 "):
            series_id = user_input[4:].strip()
            try:
                await run_series_coaching(series_id)
            except Exception as e:
                print("\n[ERROR] Error running series analysis: {}\n".format(e))

        else:
            game_id = user_input
            try:
                await run_coaching_session(game_id)
            except Exception as e:
                print("\n[ERROR] Error running analysis: {}\n".format(e))


if __name__ == "__main__":
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        print("\nGoodbye!")
