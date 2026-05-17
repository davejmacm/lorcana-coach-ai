# Lorcana Coach AI

A multi-agent coaching system for Disney Lorcana, powered by [Google ADK](https://google.github.io/adk-docs/) and Gemini. Analyzes your matches from [Duels.ink](https://duels.ink) and delivers premium post-game coaching reviews.

## Architecture

```
main.py (CLI Orchestrator)
  |
  +-- Lead_Coach Agent (Gemini 2.5 Flash)
  |     |
  |     +-- get_parsed_match_data()   -> Download, parse, cache game logs
  |     +-- get_match_series()        -> BO3 series aggregation
  |     +-- get_match_history()       -> Match list with stats
  |     |
  |     +-- Meta_Specialist Sub-Agent (Gemini 2.5 Flash)
  |           |
  |           +-- fetch_current_lorcana_meta()  -> Live metagame scraper
  |
  +-- tools/download_game_log.py      -> Duels.ink API log downloader
  +-- parse_duels_log.py              -> Core log parser engine
```

## Directory Structure

```
Log fetching/
├── main.py                    # CLI entry point & agent orchestration
├── parse_duels_log.py         # Core game log parser
├── fetch_match_history.py     # Legacy match history fetcher
├── match-history.csv          # Cached match history from API
├── .env                       # API keys (not committed)
├── .gitignore
├── todo.md                    # Project roadmap
├── README.md                  # This file
│
├── tools/                     # ADK agent tools
│   ├── get_parsed_match_data.py     # Parse single game with caching
│   ├── get_match_series.py          # BO3 series aggregation
│   ├── get_match_history.py         # Match history retrieval
│   ├── download_game_log.py         # Log file downloader
│   └── fetch_current_lorcana_meta.py # Live metagame scraper
│
├── cached_logs/               # Downloaded .logs.gz files (auto-populated)
├── cached_analyses/           # Generated coaching reports (auto-populated)
│   ├── {game_id}_summary.json
│   └── {game_id}_timeline.md
│
├── exploratoryScripts/        # Phase 1 exploration scripts (gitignored)
│
└── .venv/                     # Python 3.11 virtual environment (gitignored)
```

## Setup

### Requirements

- **Python 3.10+** (project uses 3.11.9)
- **Duels.ink account** with API access
- **Google Gemini API key**

### Installation

1. **Clone/download** the project to your machine.

2. **Create a virtual environment** (if not already present):
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment**:
   ```bash
   # Windows (PowerShell)
   .venv\Scripts\Activate.ps1

   # Windows (CMD)
   .venv\Scripts\activate.bat

   # Linux/macOS
   source .venv/bin/activate
   ```

4. **Install dependencies**:
   ```bash
   pip install google-adk requests beautifulsoup4 python-dotenv
   ```

5. **Configure environment variables** — create a `.env` file in the project root:
   ```env
   # Duels.ink Bearer Token (for match history and logs download)
   DUELS_INK_TOKEN=your_duels_ink_token_here

   # Gemini API Key (required for Google ADK execution)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running

```bash
# From the project directory, using the venv Python:
.venv\Scripts\python.exe main.py
```

Or on Windows CMD:
```cmd
"e:\Antigravity workspaces\Lorcana Coach AI\Log fetching\.venv\Scripts\python.exe" main.py
```

## Usage

The CLI supports three modes:

| Command | Description |
|---|---|
| `[game_id]` | Analyze a single BO1 game or individual BO3 game |
| `bo3 [match_id or game_id]` | Analyze a full BO3 series with cross-game trends |
| `history` | Display recent match history with win/loss stats |
| `exit` / `quit` | Close the program |

### Example Session

```
Coach > 019e3200-de01-74be-8897-57aeeffaccb0
[AI] Fetching log, parsing timeline, querying metagame...
... premium coaching review appears ...

Coach > bo3 019e27b7-a3b7-7939-b5bd-c6e66b7d45bb
[AI] Retrieving all 3 games in series...
... cross-game trend analysis appears ...

Coach > history
Match History: 115 games (2026-04-16 to 2026-05-17)
Record: 64 W / 51 L (55.7%)
...
```

## Caching

The system caches at two levels:

1. **Log files** (`cached_logs/`): Downloaded `.logs.gz` files are kept permanently. Re-downloading the same game is instant.

2. **Analysis outputs** (`cached_analyses/`): Parsed timelines and JSON summaries are saved per game_id. If the AI agent requests data for a previously-analyzed game, it returns instantly without re-parsing or re-downloading.

To force a re-analysis, delete the corresponding files from `cached_analyses/`.

## Supported Formats

| Format | Queue ID | Description |
|---|---|---|
| **Core BO1** | `core-bo1` | Standard constructed, single game |
| **Core BO3** | `core-bo3` | Standard constructed, best-of-three series |
| **Infinity BO1** | `infinity-bo1` | All sets legal, single game |
| **Quick Play** | `quick-play-core-set12` | Unranked Core format |
| **Pack Rush** | `pack-rush-*` | Limited format (draft-style) |

The coach adjusts its analysis based on format — card expectations differ between Core (limited pool) and Infinity (all sets legal).

## API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/me/match-history` | Fetch match history (CSV/JSON) |
| `GET` | `/g/{game_id}` | Download single game log (redirects to CDN) |
| `POST` | `/api/me/bulk-gamelogs` | Batch download game logs (future use) |
