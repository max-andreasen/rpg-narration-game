from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv(override=True)


class InputRouter:
    def __init__(self):
        self.model = ChatOpenAI(model="gpt-4.1-mini", temperature=0.0)

        self.system_prompt = (
            "You are an intent classifier for an RPG game. "
            "Your job is to categorize the user's input into one of two categories:\n"
            "1. 'action': The user is trying to DO something, move, attack, interact, speak to an NPC, or change the state of the world.\n"
            "2. 'world': The user is ASKING a question about lore, history, mechanics, looking at stats, or requesting information without acting.\n\n"
            "Reply ONLY with the single word: 'action' or 'world'. Do not add punctuation."
        )

    def classify(self, user_input: str) -> str:
        if not user_input or not user_input.strip():
            return "action"

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_input),
        ]

        response = self.model.invoke(messages)

        raw_content = response.content

        if isinstance(raw_content, list):
            content_str = " ".join(str(item) for item in raw_content)
        else:
            content_str = str(raw_content)

        content = content_str.strip().lower()

        if "world" in content:
            return "world"

        return "action"
