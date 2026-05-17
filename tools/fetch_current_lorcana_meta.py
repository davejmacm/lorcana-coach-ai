import requests
from bs4 import BeautifulSoup
import json

def fetch_current_lorcana_meta() -> str:
    """Scrapes current popular deck archetypes and core cards from Inkdecks.
    
    Returns:
        A JSON string containing the top deck archetypes, their metashare,
        win rates, tiers, and core cards.
    """
    print("[Tool] Running fetch_current_lorcana_meta...")
    url = "https://inkdecks.com/lorcana-metagame"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            return json.dumps({"error": "Failed to fetch metagame page. Status: {}".format(response.status_code)})
            
        soup = BeautifulSoup(response.text, 'html.parser')
        tbody = soup.find('tbody', class_='table-tbody')
        if not tbody:
            tbody = soup.find('tbody')
            
        if not tbody:
            return json.dumps({"error": "Failed to parse metagame table from HTML."})
            
        rows = tbody.find_all('tr')
        archetypes = []
        
        # Offline lookup dictionary for popular Lorcana card image codes to human-readable names
        card_lookup = {
            "SHM/153-204-en-5": "Tug-of-War (Set 5)",
            "SHM/48-204-en-5": "Madam Mim - Elephant (Set 5)",
            "WSP/56-204-en-10": "Maleficent - Uninvited Guest (Set 10)",
            "ROJ/33-204-en-8": "Flynn Rider - Frenemy (Set 8)",
            "ARCH/28-204-en-7": "Ursula - Deceiver (Set 7)",
            "ARCH/110-204-en-7": "Sisu - Emboldened Warrior (Set 7)",
            "WSP/60-204-en-10": "Clarabelle - Light on Her Feet (Set 10)",
            "ARCH/57-204-en-7": "Diablo - Devoted Herald (Set 7)",
            "WSP/57-204-en-10": "Robin Hood - Champion of Sherwood (Set 10)",
            "SHM/211-204-en-5": "Arthur - Wizard in Training (Set 5)",
            "SHM/157-204-en-5": "Oogie Boogie - Gambling Man (Set 5)",
            "SHM/213-204-en-5": "Mufasa - Betrayed Leader (Set 5)",
            "WSP/29-204-en-10": "Daisy Duck - Secret Agent (Set 10)"
        }
        
        for row in rows[:10]: # Scrape top 10 archetypes
            # 1. Archetype Name and Colors
            name_td = row.find('td', class_='sort-name')
            if not name_td:
                continue
                
            name_b = name_td.find('b')
            name_val = name_b.text.strip() if name_b else ""
            
            colors_div = name_td.find('div', class_='text-muted')
            colors_val = colors_div.text.strip() if colors_div else ""
            
            full_name = "{} {}".format(colors_val, name_val).strip()
            
            # 2. Metashare
            share_td = row.find('td', class_='sort-metashare')
            share_val = ""
            if share_td:
                share_text = share_td.get_text().strip()
                # Keep only the first line or partition by whitespace to get a clean percentage
                share_val = share_text.split('\n')[0].strip()
            
            # 3. Win Rate
            winrate_td = row.find('td', class_='sort-winrate')
            winrate_val = winrate_td.text.strip() if winrate_td else ""
            
            # 4. Tier
            tier_td = row.find('td', class_='sort-tier')
            tier_val = tier_td.text.strip() if tier_td else ""
            
            # 5. Core Cards
            core_cards = []
            imgs = row.find_all('img')
            for img in imgs:
                src = img.get('src', '')
                if '/img/cards/lorcana/' in src:
                    parts = src.split('/lorcana/')
                    if len(parts) > 1:
                        code = parts[1].replace('_tile.webp', '')
                        # Look up name or fallback to a pretty representation of the card code
                        card_name = card_lookup.get(code)
                        if not card_name:
                            # format: SET/NUMBER-en-X -> SET Card #NUMBER
                            code_parts = code.split('-')
                            if code_parts:
                                clean_code = code_parts[0] # e.g. "SHM/153"
                                card_name = "{} Card".format(clean_code)
                            else:
                                card_name = code
                        core_cards.append(card_name)
            
            # De-duplicate cards
            unique_core_cards = list(dict.fromkeys(core_cards))
            
            archetypes.append({
                "archetype": full_name,
                "metashare": share_val,
                "win_rate": winrate_val,
                "tier": tier_val,
                "core_cards": unique_core_cards[:4]
            })
            
        return json.dumps({
            "metagame": "Winterspell Metagame (Set 11)",
            "top_archetypes": archetypes
        }, indent=2)
        
    except Exception as e:
        return json.dumps({"error": "Exception occurred during scraping: {}".format(str(e))})

if __name__ == "__main__":
    res = fetch_current_lorcana_meta()
    print(res)
