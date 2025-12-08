"""
1. read the previous game state from the database
2. send that game state to state llm to try to generate correct JSON state 
3. validate the state using a testing function
4. if the state is valid, write it back to the database
"""
from db.mongodb import *
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
import os
from typing import Tuple, Optional, Dict, Any, List
import json


load_dotenv(override=True)
OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
JSON_DIR = os.path.join(BACKEND_ROOT, 'db', 'json')
WORLD_STATE_PATH = os.path.join(JSON_DIR, 'world_state_map.json')
ITEMS_STATE_PATH = os.path.join(JSON_DIR, 'items_state_map.json')

def _load_json(path: str) -> dict:
    """Helper to safely load a JSON file."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Could not find configuration file at: {path}")
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)
    
def get_all_locations() -> list[str]:
    """
    Extracts a list of all valid location IDs from the world state dictionary.
    """
    file = _load_json(WORLD_STATE_PATH)
    return list(file.get("locations", {}).keys())

def get_all_item_names() -> list[str]:
    """
    Extracts a list of all item keys from the items state dictionary.
    """
    # specific_items is the dictionary containing 'rustySword', 'lantern', etc.
    file = _load_json(ITEMS_STATE_PATH)
    specific_items = file.get("items", {})
    return list(specific_items.keys())



class GameState:
    def __init__(self,db):
        self.player_state = db["players"]
        self.dialouge = db["game_context"] # conext
        self.previous_state = None
        self.current_state = None
        self.possible_locations = get_all_locations()
        self.possible_items = get_all_item_names()

    def read_state(self):
        play_list = list(self.player_state.find({}))
        play_dict = {}
        for player in play_list:
            pid = player.get('id') # if id == None, skip
            if pid is None:      
                continue           # skip documents without id

            play_dict[pid] = {
                'name': player.get('name', ''),
                'location': player.get('position', ''),
                'health': player.get('hp', 100),
                'inventory': player.get('items', []),
            }

        self.previous_state = play_dict
        return play_dict

    def generate_state(self, llm, previous_state, session_id="temp_session"):
        # Send the previous game state to the state LLM to generate a new state
        # read the latest player actions from the database

        return llm.generate(session_id, previous_state)

    def _parse_state(self, raw_state: Any) -> Optional[Dict[str, Any]]:
        if isinstance(raw_state, dict):
            return raw_state
        if isinstance(raw_state, str):
            # 1. Strip leading/trailing whitespace and newlines
            cleaned_state = raw_state.strip()
            
            # 2. Remove common Markdown code fences if present
            if cleaned_state.startswith("```json"):
                cleaned_state = cleaned_state.removeprefix("```json").strip()
            if cleaned_state.startswith("```"):
                cleaned_state = cleaned_state.removeprefix("```").strip()
                
            if cleaned_state.endswith("```"):
                cleaned_state = cleaned_state.removesuffix("```").strip()

            try:
                return json.loads(cleaned_state)
            except json.JSONDecodeError as e:
                # You might want to log the error and the content here for debugging
                return None
        return None


    def validate_state(self, raw_state: Any) -> Tuple[bool, List[str]]:
        errors: List[str] = []

        state = self._parse_state(raw_state)
        if state is None:
            errors.append("State is not valid JSON or dict.")
            return False, errors

        if not isinstance(state, dict):
            errors.append(f"State must be a dict, got {type(state).__name__}.")
            return False, errors

        players = state.get("players")
        if not isinstance(players, dict):
            errors.append('"players" must be a dict of player_id -> player_data.')
            return False, errors

        required_keys = {"name", "location", "health", "inventory"}

        for pid, pdata in players.items():
            path = f'players["{pid}"]'

            if not isinstance(pdata, dict):
                errors.append(f"{path} must be a dict, got {type(pdata).__name__}.")
                continue

            missing = required_keys - pdata.keys()
            if missing:
                errors.append(f"{path} missing keys: {', '.join(sorted(missing))}.")

            # --- Name Validation ---
            if "name" in pdata and not isinstance(pdata["name"], str):
                errors.append(f'{path}["name"] must be str, got {type(pdata["name"]).__name__}.')

            # --- Location Validation ---
            if "location" in pdata:
                if not isinstance(pdata["location"], str):
                    errors.append(f'{path}["location"] must be str.')
                # NEW LOGIC: Check against possible_locations
                elif pdata["location"] not in self.possible_locations:
                    errors.append(
                        f'{path}["location"] "{pdata["location"]}" is invalid. '
                        f'Allowed: {self.possible_locations}'
                    )

            # --- Health Validation ---
            if "health" in pdata and not isinstance(pdata["health"], int):
                errors.append(
                    f'{path}["health"] must be int, got {type(pdata["health"]).__name__}.'
                )

            # --- Inventory Validation ---
            if "inventory" in pdata:
                if not isinstance(pdata["inventory"], list):
                    errors.append(f'{path}["inventory"] must be list.')
                else:
                    # NEW LOGIC: Check items against possible_items
                    for item in pdata["inventory"]:
                        if not isinstance(item, str):
                            errors.append(f'{path}["inventory"] contains non-string item.')
                        elif item not in self.possible_items:
                            errors.append(
                                f'{path}["inventory"] contains invalid item "{item}". '
                                f'Allowed: {self.possible_items}'
                            )

        return len(errors) == 0, errors
    
    def write_state_to_db(self, new_game_state: Dict[str, Any]) -> None:
        """
        Updates player documents in the MongoDB 'players' collection 
        based on the new game state generated by the LLM.
        Args:
            new_game_state (Dict[str, Any]): The generated game state from the LLM.
        """
        
        
        players_data = new_game_state.get("players", {})

        # 2. Iterate through each player
        for player_id, player_state in players_data.items():
            
            # 3. Map LLM keys to DB keys
            # LLM Keys: location, health, inventory
            # DB Keys: position, hp, items
            update_data = {
                "name": player_state.get("name"),
                "position": player_state.get("location"),
                "hp": player_state.get("health"),
                "items": player_state.get("inventory")
            }
            
            # Remove None values just in case, though the state should be complete
            update_data = {k: v for k, v in update_data.items() if v is not None}

            # 4. Perform the update operation
            # Use $set to update fields and the 'id' field for matching
            result = self.player_state.update_one(
                {"id": player_id},
                {"$set": update_data}
            )




        
class State_LLM:

    def __init__(self):
        self.model = ChatOpenAI(model="gpt-4.1-mini", temperature=0.3)
        self.possible_locations = get_all_locations()
        self.possible_items = get_all_item_names()
        locs_str = ", ".join(self.possible_locations)
        items_str = ", ".join(self.possible_items)


        self.system_prompt = f"""
        You are the authoritative state manager for a cooperative role-playing game.

        You always:
        - Take the previous game state (JSON) as the single source of truth.
        - Read the most recent narrator text and player actions.
        - Apply only the logically necessary updates to the game state.
        - Leave all unrelated fields unchanged.

        ### STRICT DATA CONSTRAINTS
        You must ONLY use values from the following lists. Do not invent new names.
        - **Allowed Locations:** [{locs_str}]
        - **Allowed Items:** [{items_str}]
        
        *If a player tries to go to a location or pick up an item not in these lists, ignore that specific change.*

        ### GAME STATE FORMAT (JSON)
        {{
            "players": {{
                "<player_id>": {{
                    "name": "<string>",
                    "location": "<string from Allowed Locations>",
                    "health": <int>,
                    "inventory": ["<string from Allowed Items>", ...]
                }},
                ...
            }}
        }}

        ### YOUR TASK
        1) Read the previous game state.
        2) Consider the narrator description and player messages.
        3) Update locations, health, and inventories to reflect the new situation.
        4) Do NOT invent new players or remove players unless clearly implied.
        5) Return ONLY the updated game state as valid JSON. No explanations, no commentary.
        """

    def build_prompt(self, session_id: str, game_state: dict, n_turns: int, validation_errors: Optional[List[str]] = None):
        messages = []

        # System instructions
        messages.append(SystemMessage(content=self.system_prompt))

        # Previous game state as JSON
        if game_state:
            state_json = json.dumps({"players": game_state}, indent=2)
            messages.append(
                SystemMessage(
                    content=f"Previous game state (JSON):\n```json\n{state_json}\n```"
                )
            )
        if validation_errors:
                    error_msg = "\n".join(f"- {e}" for e in validation_errors)
                    messages.append(
                        HumanMessage(
                            content=(
                                f"CRITICAL ERROR: The last generated state FAILED validation. "
                                "You MUST correct the following issues and regenerate the state:\n"
                                f"{error_msg}\n\n"
                                "Return ONLY the corrected, valid JSON state."
                            )
                        )
                    )

        # Previous turns from DB
        turns = get_turns(session_id, limit=n_turns)
        for turn in turns:
            messages.append(SystemMessage(content=f"NARRATOR: {turn['narration']}"))
            for pid, txt in turn["player_prompts"].items():
                messages.append(HumanMessage(content=f"Player {pid}: {txt}"))

        # Final explicit instruction
        messages.append(
            HumanMessage(
                content=(
                    "Update the game state JSON based on the narrator and player actions "
                    "above and return ONLY the new game state JSON."
                )
            )
        )

        return messages

    def generate(self, session_id: str, game_state: dict, validation_errors: Optional[List[str]] = None) -> str:
        prompt = self.build_prompt(session_id, game_state, n_turns=1, validation_errors=validation_errors)
        ai_message = self.model.invoke(prompt)
        content = ai_message.content

        if isinstance(content, list):
            content = " ".join(
                item if isinstance(item, str) else str(item) for item in content
            )

        return content
    



def run_state_management():
    MAX_RETRIES = 2
    # It's better to manage the Mongo URL outside if this is run in a production environment
    MONGO_URL = os.getenv("MONGO_URL")
    # This hardcoded URL should be removed in production
    if not MONGO_URL:
        return print("MONGO_URL not set in environment variables.")
    
    client = MongoClient(MONGO_URL, tls=True, tlsAllowInvalidCertificates=True)
    mongo_db = client["rpg_dev"]
    
    state_manager = GameState(db=mongo_db)
    state_llm = State_LLM()
    SESSION_TEMP_ID = "session_1"
    previous_state = state_manager.read_state()

    new_state_raw = None
    is_valid = False
    errs = []
    
    for attempt in range(MAX_RETRIES):
        
        # If not the first attempt, pass the errors back to the LLM
        errors_to_report = errs if attempt > 0 else None
        
        # Generate new state (now includes error reporting)
        new_state_raw = state_llm.generate(
            session_id=SESSION_TEMP_ID, 
            game_state=previous_state, 
            validation_errors=errors_to_report
        )

        # Validate the generated state
        is_valid, errs = state_manager.validate_state(new_state_raw)
        if is_valid:
            break
        else:
            for e in errs:
                print(f" - {e}")
            if attempt < MAX_RETRIES - 1:
                print("Reporting errors to LLM and retrying...")
    
    # Write State or Log Failure
    if is_valid:
        # Get the parsed dictionary
        new_state_dict = state_manager._parse_state(new_state_raw) 
        
        # Write back to the database
        state_manager.write_state_to_db(new_state_dict)
        print("\nSUCCESS: Game state updated in the database.")
    else:
        print(f"\nFATAL: Failed to generate a valid state after {MAX_RETRIES} attempts.")
    

