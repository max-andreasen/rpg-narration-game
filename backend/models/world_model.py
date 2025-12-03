"""
The model that works in the other chat, integrated with the RAG db
"""

from db.mongodb import *
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
from models.rag import * # how does it work with the retriver var? 

load_dotenv(override=True)


class WorldModel:

    def __init__(self):
        self.model = ChatOpenAI(model="gpt-4.1-mini", temperature=0.99)

        self.system_prompt = (
            "You are a mysterious LORE expert capable of answering user questions about the world"
        )

    def build_prompt(self, session_id: str, user_message: str, n_turns : int = 5):
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
            messages.append(SystemMessage(content=f"NARRATOR: {turn['narration']}"))
            rag_query_parts.append(f"NARRATOR: {turn['narration']}")

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
            print(f"Error during RAG call in build_prompt: {e}. Proceeding without context.")
        return messages

    def generate(self, session_id: str, question: str) -> str:
        prompt = self.build_prompt(session_id, question, n_turns=5)
        prompt = "\n".join(prompt) # unlistify
        ai_message = self.model.invoke(prompt)
        content = ai_message.content

        try:
            next_turn_idx = get_next_turn_index(session_id)
            # next up is how we store the messege history

        except Exception as e:
            print(f"Error saving to DB: {e}")
        return content
