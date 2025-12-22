"""
This file provides methods specifically for storing conversations from 
the world LLM, which are not registerred in the database. 
"""

from pathlib import Path
import json
import os

# Retrieves the latest file that has been written to
def get_latest_write_file_number():
    """
    Retrives the current index in 'saved-data', which indicates the latest file. 
    """
    folder_path = Path(__file__).parent / "saved-data"
    max_num = 0
    for file in folder_path.glob("data_players_*.json"):
        num = int(file.stem.split("_")[-1])
        if num > max_num:
            max_num = num
    return max_num


def save_convo_to_file(pid, player_message, narrator_response, turn):
    """
    Specifically saves the conversation with the world LLM to JSON file, since that information is not stored in database. 
    """
    print("Saving world convo to file...")
    data_to_store = {"player_id": pid, "turn": turn, "player_message": player_message, "narrator_response": narrator_response}
    
    folder_path = Path(__file__).parent / "saved-data"
    folder_path.mkdir(parents=True, exist_ok=True)  # ensure folder exists
    latest_write_num = get_latest_write_file_number()

    file_to_write_convo = folder_path / f"data_world_{latest_write_num}.json"
    
    with open(file_to_write_convo, "a") as f:
        f.write(json.dumps(data_to_store, default=str) + "\n")
    f.close()
    return


def save_actions_to_file(players_collection, game_context_collection):
    """
    Specifically saves the action message and the narrators response to the action messages in a JSON file format. 
    This assumes the action messages are stored in the database.
    """
    print("Saving actions to file...")
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


def refresh_json_storage():
    """
    Prepares new JSON documents for the next session. 
    This will create json files in 'saved-data' with increased index.
    """
    next_write_num = get_latest_write_file_number() + 1
    folder_path = Path(__file__).parent / "saved-data"
    file_path = os.path.join(folder_path, f"data_players_{next_write_num}.json")
    with open(file_path, "w") as f:
        f.write("") 
    file_path = os.path.join(folder_path, f"data_context_{next_write_num}.json")
    with open(file_path, "w") as f:
        f.write("") 
    file_path = os.path.join(folder_path, f"data_world_{next_write_num}.json")
    with open(file_path, "w") as f: 
        f.write("")