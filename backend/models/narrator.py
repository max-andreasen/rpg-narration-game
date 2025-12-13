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

        self.system_prompt = (
            "You are the narrator of a role-playing adventure. "
            "You describe the world, interpret player actions, maintain consistency, "
            "and continue the story based on the provided GAME STATE context."
        )

    def build_prompt(
        self, session_id: str, game_state: dict, world_context: str, n_turns: int
    ):
        messages = []

        # System prompt
        messages.append(SystemMessage(content=self.system_prompt))

        # Game state summary
        if world_context:
            messages.append(SystemMessage(content=f"WORLD CONTEXT:\n{world_context}"))
            # this is where we say what the world looks like, items, NPCs etc.

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

    def generate(self, session_id: str, game_state: dict) -> str:
        world_context = read_json_states(read_player_state())
        prompt = self.build_prompt(session_id, game_state, world_context, n_turns=20)
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
