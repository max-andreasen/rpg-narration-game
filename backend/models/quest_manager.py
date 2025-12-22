import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv(override=True)


class QuestManager:
    def __init__(self, all_quests_definitions: dict):

        self.quests_def = all_quests_definitions

        self.model = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.0,
            model_kwargs={"response_format": {"type": "json_object"}},
        )

        self.system_prompt = (
            "You are the Quest Arbiter for an RPG game. "
            "Your task is to verify if a player has completed a quest objective based on the story narration.\n"
            "You will receive:\n"
            "1. A list of CANDIDATE QUESTS (active quests in the player's current location).\n"
            "2. The PLAYER ACTION (what they tried to do).\n"
            "3. The NARRATION RESULT (what actually happened).\n\n"
            "Task:\n"
            "- Analyze if the narration confirms the player achieved the 'target_npc' interaction, 'target_item' pickup, or 'combat_victory'.\n"
            "- IMPORTANT: The player must SUCCEED. If the narrator says 'You failed' or 'It is locked', the quest is NOT complete.\n"
            "- Return a JSON object with a single key 'completed_quest_ids' containing a list of IDs for quests completed in this turn.\n"
            "- If no quest is completed, return an empty list in the JSON."
        )

    def _get_candidate_quests(
        self, player_location: str, completed_quests_ids: list
    ) -> dict:

        candidates = {}

        for q_id, q_data in self.quests_def.items():
            if q_id in completed_quests_ids:
                continue

            if q_data.get("location") != player_location:
                continue

            prereqs = q_data.get("prerequisites", [])
            if all(p in completed_quests_ids for p in prereqs):
                candidates[q_id] = q_data

        return candidates

    def check_progress(
        self,
        player_location: str,
        completed_quests_ids: list,
        narration: str,
        player_action: str,
    ) -> list:
        candidate_quests = self._get_candidate_quests(
            player_location, completed_quests_ids
        )

        if not candidate_quests:
            return []

        simplified_candidates = {
            qid: {
                "title": q["title"],
                "description": q["description"],
                "target_objective": q.get("target_npc")
                or q.get("target_item")
                or "Victory",
                "type": q.get("type"),
            }
            for qid, q in candidate_quests.items()
        }

        user_content = f"""
        PLAYER LOCATION: {player_location}
        
        ACTIVE QUESTS HERE: {json.dumps(simplified_candidates, indent=2)}
        
        ---
        PLAYER ACTION: "{player_action}"
        NARRATOR RESULT: "{narration}"
        ---
        
        Did the player complete any of the above quests?
        """

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_content),
        ]

        try:
            response = self.model.invoke(messages)

            raw_content = response.content
            if isinstance(raw_content, list):
                json_str = " ".join(str(item) for item in raw_content)
            else:
                json_str = str(raw_content)

            result = json.loads(json_str)
            return result.get("completed_quest_ids", [])

        except json.JSONDecodeError:
            print("ERROR: QuestManager AI returned invalid JSON.")
            return []
        except Exception as e:
            print(f"ERROR: QuestManager failed: {e}")
            return []
