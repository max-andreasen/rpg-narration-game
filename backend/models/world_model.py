"""
The model that works in the other chat, integrated with the RAG db
"""

from db.mongodb import *
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
from models.rag import *

load_dotenv(override=True)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class WorldModel:

    def __init__(self):
        self.model = ChatOpenAI(model="gpt-4.1-mini", temperature=0.99)

        self.system_prompt = "You are a mysterious LORE expert capable of answering user questions about the world"

    def build_prompt(
        self, session_id: str, user_message: str, n_turns: int = 5, context: str = ""
    ) -> list:
        """
        Builds the final list of messages for the LLM call.

        This method now constructs a string from history + user message,
        passes it to the RAG system (ask()), and appends the retrieved context
        to the final list of messages.
        """
        messages = []
        rag_query_parts = []
        messages.append(SystemMessage(content=self.system_prompt))

        turns = get_turns(session_id, limit=n_turns)
        for turn in turns:
            messages.append(
                SystemMessage(content=f"NARRATOR: {turn['narration']}")
            )  # Only add the narrator part (user action not needed )
            rag_query_parts.append(f"NARRATOR: {turn['narration']}")

        if context:
            messages.append(
                SystemMessage(content=f"ADDITIONAL CONTEXT: {context}")
            )  # to add extra context if needed
            rag_query_parts.append(f"ADDITIONAL CONTEXT: {context}")

        messages.append(HumanMessage(content=user_message))
        rag_query_parts.append(f"USER QUESTION: {user_message}")
        rag_query_string = "\n".join(rag_query_parts)

        try:
            rag_results = ask(rag_query_string)
            if rag_results:
                context_message = (
                    "\n\n--- RAG CONTEXT ---\n"
                    f"Use the following LORE excerpts to formulate your answer:\n"
                    f"{rag_results}\n"
                    "---------------------"
                )
                messages.append(SystemMessage(content=context_message))
        except Exception as e:
            print(
                f"Error during RAG call in build_prompt: {e}. Proceeding without context."
            )
        return messages

    def generate(self, session_id: str, question: str, context: str = "") -> str:
        ## USUAGE: 1 - create WorldModel instance, 2 - call generate(session_id, question) to get response (pass context if needed)
        prompt = self.build_prompt(session_id, question, n_turns=5, context=context)
        ai_message = self.model.invoke(prompt)
        content = ai_message.content

        if isinstance(content, list):
            content = " ".join(
                item if isinstance(item, str) else str(item) for item in content
            )

        return content
