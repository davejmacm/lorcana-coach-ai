# Lorcana Coach AI - Future Roadmap & Task List

This living document outlines outstanding refinements, architectural updates, and next-phase gamification features for the Lorcana Coach AI multi-agent platform.

---

## 📅 Immediate Next Steps (Tomorrow's Session)

### 🔧 Log Retrieval & Format Extensions
- [x] **Dynamic Log Downloader Integration:** Extend the local match retrieval scripts so they can automatically query other `game_id` entries directly from `match-history.csv` and pull the compressed `.logs.gz` files from the Duels.ink CDN on demand.
- [x] **BO3 Format Support:** 
  - [x] Update [parse_duels_log.py](file:///e:/Antigravity%20workspaces/Lorcana%20Coach%20AI/Log%20fetching/parse_duels_log.py) to parse BO3 games (tracking `match_id` and specific game numbers, e.g. game `1`, `2`, `3` in a series).
  - [x] Enable the `Lead_Coach` agent to synthesize cross-game match trends (e.g. how the player adapted after losing Game 1).
- [x] **Core vs. Infinity Queues:** Teach the parser to distinguish between standard `Core` constructed sets and `Infinity` format rules, adjusting card expectations and tier lists based on `queue_name` / `queue_id`.

### ⚡ Optimization & Caching
- [x] **Analysis Caching Layer:** Avoid duplicate heavy API and log parsing calls.
  - [x] Implement a local caching mechanism (e.g., check if a structured coaching report `.json` or `.md` exists for the given `game_id` under a dedicated `/cached_analyses` directory).
  - [x] Return the pre-generated review instantly if the game has already been analyzed.

### 🧹 Structure & Documentation Cleanup
- [x] **Directory Reorganization:** Organize the root directory to separate operational files, utility scripts, and assets:
  - `/tools` - ADK agent tools
  - `/cached_logs` - Downloaded `.logs.gz` matches
  - `/cached_analyses` - Generated markdown/JSON coaching reports
- [x] **Developer Documentation:** Write a clear `README.md` documenting architecture, requirements, and environment setups.

---

## 🚀 Next Phase Items (Future Deliverables)

### 📱 User Interface (Mobile-Friendly Web App)
- [x] **Match History Dashboard:**
  - [x] Fetch the list of previous matches from `match-history.csv` or API.
  - [x] Display an expandable/collapsible list grouped by deck colors or opponent display name.
- [x] **Expandable Match Cards:** Click a match card to see an overview (Result, Lore, Round Count, Deck colors).
- [x] **"Ask Coach" Integration:** Implement a premium, mobile-responsive "Ask Coach" button next to each match. Clicking it submits the `game_id` to the ADK orchestrator in the background and renders the Coach's review directly inside the web interface.

### 🎨 UI Enhancements
- [ ] Input validation for bearer token
- [ ] Fix input validation to actually validate rather than just formatting the input
- [ ] Potential for authentication to save re-entering token each time
- [ ] Update readme for UI

### 🌐 API
- [ ] Implement fastAPI layer
- [ ] Decide on how to handle 'aggregated improvements' with token efficiency in mind
- [ ] Data structure to UI
- [ ] Update readme for API

### 🧠 Advanced Coaching & Analytics
- [ ] **Matchup Trend Engines:**
  - [ ] Analyze mulligan patterns over multiple games to highlight opening hands that correlate with higher win rates vs. loss rates.
  - [ ] Track repeating pivot cards (cards whose play or banishment consistently marks a loss of momentum).

---

## 🎮 Gamification & Advanced Simulation

### 🧩 "Find the Line" Puzzle Generator
- [ ] Parse log timelines for unplayed combinations or missed plays.
- [ ] Generate gamified custom puzzles:
  - *Example:* "You missed a 20-lore play on Turn 8. Can you spot the sequence of questing and bounce triggers that would have won the game?"

### 📊 Ink Curve & Resource Management Analyst
- [ ] Spot player inkwell habits across multiple log timelines.
- [ ] Highlight bad resource habits:
  - Consistently inking high-value late-game win conditions too early.
  - Keeping too many uninkable cards in hand and stalling out on curves.

### 🔀 Alternative Scenario Simulator ("What-Ifs")
- [ ] Allow users to branch the log state at a specific turn.
- [ ] *Example:* "What if I challenged their Flynn Rider instead of questing? Let's branch the game state and run a simulated outcome of the next two turns."

---

## 🌟 Stretch Goals
- [ ] **Deterministic Turn-by-Turn Win-Probability Graphs:**
  - [ ] Implement a mathematical momentum index formula in Python (`parse_duels_log.py`) based on comparative board presence, quest potential, hand size, and lore.
  - [ ] Expose turn-by-turn probability percentages via API and render a visual timeline chart in React.

