# Lorcana Coach AI – Web UI Dashboard

This is the React + Vite frontend for the Lorcana Coach AI dashboard. It communicates with the FastAPI backend to render match history, deck stats, and detailed post-game coaching logs (mulligan decisions, pivot turns, and key takeaways).

## Prerequisites

Before starting the frontend, ensure you have:
1. **Node.js** installed (v18+ recommended).
2. The **Backend API Server** running at `http://127.0.0.1:8000` (refer to the root [README.md](file:///e:/Antigravity%20workspaces/Lorcana%20Coach%20AI/Log%20fetching/README.md) for details).

## Setup & Running

1. **Navigate to the UI directory** (from the project root):
   ```bash
   cd ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

Once started, the CLI output will display the local URL (usually `http://localhost:5173`). Open this URL in your web browser.

## Project Structure & Architecture

- **`src/components/`**: Reusable UI blocks such as `Hero.jsx`, deck panels, match list details, and coach timeline visualizers.
- **Vite Proxy**: The dev server is configured via `vite.config.js` to proxy `/api` requests to the FastAPI backend running on port `8000`. This bypasses CORS restrictions in local development.
