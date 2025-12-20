"""
Contains the narrational model and the logic.
E.g. system prompt, LangChain implementation, RAG lookup etc.
Uses user input and game state as input to generate an output.
"""

# we are trying to build the input for the model: it should contain the input from the users, system prompt, the context (narrator's message), and state.

from db.mongodb import *
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv


load_dotenv(override=True)


class Narrator:
    def __init__(self):
        self.model = ChatOpenAI(model="gpt-4.1-mini", temperature=0.99)

        old_prompt = (
            "You are the narrator of a role-playing adventure. "
            "You describe the world, interpret player actions, maintain consistency, "
            "and continue the story based on the provided GAME STATE context."
            "If the player asks for an action that is unreasonable or that they do not have the items for, make them fail in a funny way"
            "The players can take damage as an result of actions or attacks against them"
        )

        self.system_prompt = (
            "You are the Narrator of a role-playing adventure. Your goal is to describe the world and the immediate outcomes of player actions using the provided GAME STATE."
            "Rules of Engagement:"
            "1. Consistency: Never contradict the GAME STATE or the LORE provided."
            "2. Player Agency: Describe the world and NPCs, but never speak or act for the players characters."
            "3. Reasonable Actions: If a player lacks the necessary items or attempts something physically impossible, describe their failure in a humorous or ironic way."
            "4. Consequence: Actions have stakes. If a player fails a dangerous task or is attacked, describe the damage (1-100) they take clearly within the narrative."
            "5. Conciseness: Keep descriptions vivid but brief to keep the game moving."
        )

    def build_prompt(
        self,
        session_id: str,
        game_state: dict,
        world_context: str,
        n_turns: int,
        quest_context: str,
    ):
        messages = []

        # System prompt
        messages.append(SystemMessage(content=self.system_prompt))

        # Game state summary
        if world_context:
            messages.append(SystemMessage(content=f"WORLD CONTEXT:\n{world_context}"))
            # this is where we say what the world looks like, items, NPCs etc.

        if quest_context:
            q_message = (
                f"QUEST LOG (Current Player Objectives):\n"
                f"{quest_context}\n"
                f"INSTRUCTIONS: Use this to drive the narrative. If the player interacts with a Quest Target (NPC or Item), "
                f"describe the outcome vividly. If they are in a quest location, hint at the objective."
            )
            messages.append(SystemMessage(content=q_message))

        if game_state:
            messages.append(SystemMessage(content=f"GAME STATE:\n{game_state}"))

        # Previous turns from DB
        turns = get_turns(session_id, limit=n_turns)
        for turn in turns:
            messages.append(SystemMessage(content=f"NARRATOR: {turn['narration']}"))
            for pid, txt in turn["player_prompts"].items():
                messages.append(HumanMessage(content=f"Player {pid}: {txt}"))

        # Latest user input
        for pid, txt in game_state["player_messages"].items():
            messages.append(HumanMessage(content=f"Player {pid}: {txt}"))

        return messages

    def generate(self, session_id: str, game_state: dict, quests_data: list) -> str:
        world_context = read_json_states(read_player_state())
        quest_context_str = ""
        if quests_data:
            for q in quests_data:
                quest_context_str += f"- Quest '{q['title']}': {q['description']} (Target: {q.get('target_item') or q.get('target_npc')})\n"
        prompt = self.build_prompt(
            session_id,
            game_state,
            world_context,
            n_turns=20,
            quest_context=quest_context_str,
        )
        ai_message = self.model.invoke(prompt)
        content = ai_message.content

        if isinstance(content, list):
            content = " ".join(
                item if isinstance(item, str) else str(item) for item in content
            )

        try:
            next_turn_idx = get_next_turn_index(session_id)

            add_turn(
                session_id=session_id,
                turn_index=next_turn_idx,
                narration=content,
                player_prompts=game_state.get("player_messages", {}),
            )
            print(f"Turn {next_turn_idx} saved in DB.")

        except Exception as e:
            print(f"Error saving to DB: {e}")

        return content
