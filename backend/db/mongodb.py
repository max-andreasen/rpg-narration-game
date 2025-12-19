"""
The interface / service connected to the database.
Extracts and returns data.
Also writes new data to the database.
"""

from typing import Any, Dict, Optional
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
from datetime import datetime
from collections import defaultdict
from pathlib import Path

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL, tls=True, tlsAllowInvalidCertificates=True)


mongo_db = client["rpg_dev"]

players_collection = mongo_db["players"]
npcs_collection = mongo_db["npcs"]
game_context_collection = mongo_db["game_context"]


def get_player(player_id: str) -> Optional[Dict[str, Any]]:
    return players_collection.find_one({"id": player_id})


def get_all_players() -> list[Dict[str, Any]]:
    players = []
    for player in players_collection.find():
        players.append(
            {
                "id": player.get("id"),
                "name": player.get("name"),
                "race": player.get("race"),
                "gender": player.get("gender"),
            }
        )
    return players


def add_player(player_data: Dict[str, Any]) -> Dict[str, Any]:
    if "id" not in player_data:
        raise ValueError("ID is missing")

    if get_player(player_data["id"]):
        raise ValueError(f"A player with ID '{player_data['id']}' already exists")

    player_data["created_at"] = datetime.utcnow()

    result = players_collection.insert_one(player_data)
    player_data["_id"] = result.inserted_id

    return player_data


def add_turn(
    session_id: str, turn_index: int, narration: str, player_prompts: Dict[str, str]
) -> Dict[str, Any]:
    doc = {
        "session_id": session_id,
        "turn_index": turn_index,
        "narration": narration,
        "player_prompts": player_prompts,
    }
    game_context_collection.insert_one(doc)
    return doc


def get_next_turn_index(session_id: str) -> int:
    last_turn = game_context_collection.find_one(
        {"session_id": session_id},
        sort=[("turn_index", -1)],
    )
    if last_turn:
        return last_turn["turn_index"] + 1
    return 1


def get_turns(session_id: str, limit: int = 10) -> list[Dict[str, Any]]:
    cursor = (
        game_context_collection.find({"session_id": session_id})
        .sort("turn_index", 1)
        .limit(limit)
    )
    return list(cursor)


# Retrieves the latest file that has been written to
def get_latest_write_file_number():
    folder_path = Path(__file__).parent / "saved-data"
    max_num = 0
    for file in folder_path.glob("data_players_*.json"):
        num = int(file.stem.split("_")[-1])
        if num > max_num:
            max_num = num
    return max_num


def save_to_file():
    print("Saving to file...")
    folder_path = Path(__file__).parent / "saved-data"
    folder_path.mkdir(parents=True, exist_ok=True)  # ensure folder exists
    latest_write_num = get_latest_write_file_number()

    file_to_write_players = folder_path / f"data_players_{latest_write_num}.json"
    file_to_write_context = folder_path / f"data_context_{latest_write_num}.json"
    
    with open(file_to_write_context, "w") as f:
        for doc in game_context_collection.find():
            f.write(json.dumps(doc, default=str) + "\n")
    f.close()
    with open(file_to_write_players, "w") as f:
        for doc in players_collection.find(): 
            f.write(json.dumps(doc, default=str) + "\n")
    f.close()
    return
        

# Clears EVERYTHING in the database and sets up new write file for next session
def clear_db():
    players_collection.drop()
    npcs_collection.drop()
    game_context_collection.drop()

    next_write_num = get_latest_write_file_number() + 1
    folder_path = Path(__file__).parent / "saved-data"
    file_path = os.path.join(folder_path, f"data_players_{next_write_num}.json")
    with open(file_path, "w") as f:
        f.write("") 
    file_path = os.path.join(folder_path, f"data_context_{next_write_num}.json")
    with open(file_path, "w") as f:
        f.write("") 


def read_player_state():
    """Fetches all players and formats them into a dictionary keyed by ID."""
    player_collection = mongo_db["players"]
    play_list = list(player_collection.find({}))
    play_dict = {}

    for player in play_list:
        pid = player.get("id")
        if pid is None:
            continue

        play_dict[pid] = {
            "name": player.get("name", "Unknown Wanderer"),
            "location": player.get("position", "startingVillage"),  # Default to start
            "health": player.get("hp", 100),
            "inventory": player.get("items", []),
        }
    return play_dict


def read_json_states(players_dict: dict) -> str:
    # --- 1. Load Static Data (World, Items, NPCs) ---
    # (Using relative paths as established previously)
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

    def load_json(filename):
        path = os.path.join(CURRENT_DIR, "json", filename)
        with open(path, "r") as f:
            return json.load(f)

    char_map = load_json("character_state_map.json")
    item_map = load_json("items_state_map.json")
    loc_map = load_json("world_state_map.json")

    # --- 2. Group Players by Location ---
    # This allows the LLM to know who is standing next to whom
    players_by_location = defaultdict(list)
    for pid, data in players_dict.items():
        loc = data["location"]
        players_by_location[loc].append(data)

    # --- 3. Build Markdown Output ---
    output_lines = ["# GLOBAL GAME STATE\n"]

    # Iterate through every location that has at least one player
    for location_key, players_here in players_by_location.items():

        # Get Location Details
        loc_data = loc_map["locations"].get(location_key, {})
        loc_desc = loc_data.get("description", "A void.")
        loc_exits = ", ".join(loc_data.get("canGoTo", []))

        output_lines.append(f"## LOCATION: {location_key}")
        output_lines.append(f"> {loc_desc}")
        output_lines.append(f"**Exits:** {loc_exits}\n")

        # List NPCs at this location
        output_lines.append("**NPCs Present:**")
        npcs = loc_data.get("npcs", [])
        if npcs:
            for npc_key in npcs:
                npc_obj = char_map["characters"].get(npc_key, {})
                output_lines.append(
                    f"- {npc_key}: {npc_obj.get('description')} (HP: {npc_obj.get('health')})"
                )
        else:
            output_lines.append("- None")

        # List PLAYERS at this location
        output_lines.append("\n**PLAYERS HERE:**")
        for p in players_here:
            # Resolve Inventory Names
            inv_names = []
            for i_key in p["inventory"]:
                item_obj = item_map["items"].get(i_key, {})
                inv_names.append(
                    item_obj.get("name", i_key)
                )  # Fallback to ID if name missing

            inv_str = ", ".join(inv_names) if inv_names else "Empty handed"
            output_lines.append(
                f"- **{p['name']}** (HP: {p['health']}) | Holding: [{inv_str}]"
            )

        output_lines.append("\n" + "-" * 30 + "\n")

    return "\n".join(output_lines)


def delete_player(player_id: str) -> bool:
    result = players_collection.delete_one({"id": player_id})
    return result.deleted_count > 0
