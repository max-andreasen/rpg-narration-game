"""
The interface / service connected to the database.
Extracts and returns data.
Also writes new data to the database.
"""

from typing import Any, Dict, Optional
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(MONGO_URL, tls=True, tlsAllowInvalidCertificates=True)


mongo_db = client["rpg_dev"]

players_collection = mongo_db["players"]
npcs_collection = mongo_db["npcs"]
game_context_collection = mongo_db["game_context"]


def get_player(player_id: str) -> Optional[Dict[str, Any]]:
    return players_collection.find_one({"id": player_id})


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
