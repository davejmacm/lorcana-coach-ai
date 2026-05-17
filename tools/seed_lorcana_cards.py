import os
import json
import time
import requests

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "lorcana_cards.json")

def seed_cards():
    print("Starting Lorcana card catalog seed from Lorcast API...")
    
    # 1. Fetch all sets
    print("Fetching sets...")
    sets_resp = requests.get("https://api.lorcast.com/v0/sets")
    if sets_resp.status_code != 200:
        print(f"Failed to fetch sets. Status: {sets_resp.status_code}")
        return
        
    sets_data = sets_resp.json().get("results", [])
    set_codes = [s["code"] for s in sets_data]
    print(f"Found {len(set_codes)} sets: {', '.join(set_codes)}")
    
    all_cards = {}
    
    # 2. Fetch cards for each set
    for set_code in set_codes:
        print(f"Fetching cards for set '{set_code}'...")
        cards_url = f"https://api.lorcast.com/v0/sets/{set_code}/cards"
        
        while cards_url:
            resp = requests.get(cards_url)
            if resp.status_code != 200:
                print(f"Warning: Failed to fetch cards for set {set_code} at {cards_url}. Status: {resp.status_code}")
                break
                
            data = resp.json()
            
            # /sets/:id/cards returns a list directly
            results = data if isinstance(data, list) else data.get("results", [])
            
            for c in results:
                col_num = c.get("collector_number")
                if not col_num:
                    continue
                    
                card_id = f"{set_code}-{col_num}"
                
                # Combine name and version for full name
                base_name = c.get("name", "")
                version = c.get("version", "")
                full_name = f"{base_name} - {version}" if version else base_name
                
                # Extract relevant fields
                all_cards[card_id] = {
                    "name": full_name,
                    "inkwell": c.get("inkwell", False),
                    "cost": c.get("cost", 0),
                    "ink": c.get("ink", ""),
                    "type": c.get("type", []),
                    "keywords": c.get("keywords", []),
                    "image_uris": c.get("image_uris") or {}
                }
                
            # /sets/:id/cards is not paginated
            cards_url = None
            
            # Respect rate limits (~10 req/sec)
            time.sleep(0.15)
            
    # 3. Save to disk
    print(f"Finished fetching. Total cards parsed: {len(all_cards)}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_cards, f, indent=2)
        
    print(f"Successfully saved catalog to {OUTPUT_FILE}")

if __name__ == "__main__":
    seed_cards()
