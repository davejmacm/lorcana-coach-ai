import urllib.request
import urllib.parse
import csv
import io
import os
import json
import gzip

from dotenv import load_dotenv

load_dotenv()
TOKEN = os.environ.get("DUELS_INK_TOKEN")

def fetch_match_history():
    url = (
        "https://duels.ink/api/me/match-history"
        "?format=csv"
        "&source=matchmaking"
        "&queue=core-bo1%2Ccore-bo3%2Ccore-zh-bo1%2Cquick-play-core-set12"
        "&from=2026-04-16T00%3A00%3A00Z"
        "&to=2026-05-16T23%3A59%3A59Z"
    )
    
    req = urllib.request.Request(
        url,
        headers={"Authorization": "Bearer {}".format(TOKEN)}
    )
    
    print("Fetching match history from:", url)
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
            print("Successfully fetched match history. Length:", len(content))
            return content
    except Exception as e:
        print("Error fetching match history:", e)
        return None

def main():
    csv_content = fetch_match_history()
    if not csv_content:
        return
        
    # Save match history to CSV
    csv_path = "match-history.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write(csv_content)
    print("Saved match history to {}".format(csv_path))
    
    # Parse CSV to find match log URLs
    reader = csv.DictReader(io.StringIO(csv_content))
    rows = list(reader)
    print("Found {} matches in history.".format(len(rows)))
    
    if not rows:
        print("No matches found.")
        return
        
    # Let's inspect the headers
    headers = reader.fieldnames
    print("CSV Headers:", headers)
    
    # Let's show the first row details to understand it
    print("\nFirst row sample:")
    for k, v in rows[0].items():
        print("  {}: {}".format(k, v))
        
    # Find log URL or download URL. Let's look for columns with 'log', 'url', 'id', 'link', etc.
    # Typically it might have a 'game_id', 'match_id', or a direct log URL.
    log_url = None
    for key in rows[0].keys():
        if 'log' in key.lower() or 'url' in key.lower():
            val = rows[0][key]
            if val and (val.startswith('http') or '.gz' in val or 'log' in val):
                log_url = val
                print("\nFound log URL in column '{}': {}".format(key, log_url))
                break
                
    if not log_url:
        print("\nCould not find direct log URL. Looking for match identifiers...")
        game_id = None
        for key in ['id', 'game_id', 'match_id', 'gameId', 'matchId']:
            if key in rows[0]:
                game_id = rows[0][key]
                print("Found game/match ID: {} = {}".format(key, game_id))
                break

if __name__ == "__main__":
    main()
