"""
RAG engine: loads documents, chunks them, embeds them, and exposes
a retriever + a simple `ask` function that narrator.py can call.
"""

import os
import glob
from dotenv import load_dotenv, find_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader, PyPDFLoader



BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
load_dotenv(find_dotenv())
OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
DATA_PATH = os.path.join(BASE_DIR, "backend/db/RAG/text")
DB_DIR   = os.path.join(BASE_DIR, "backend/db/RAG/vec_DB")

# LOAD + CHUNK
def load_and_chunk():
    docs = []
    
    # Iterate over all files in the folder
    for file_path in glob.glob(os.path.join(DATA_PATH, "*")):
        ext = file_path.lower()
        print(file_path)
        if ext.endswith(".txt") or ext.endswith(".md"):
            loader = TextLoader(file_path)
        elif ext.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        else:
            print(f"Skipping unsupported file: {file_path}")
            continue
        
        docs.extend(loader.load())
    
    # 2. Chunk them
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )
    print(splitter)
    
    return splitter.split_documents(docs)


def init_vectorstore():  # vectorizes our embeddings
    """
    Function that initializes the vectorstore, could be used in eg main loop
    """

    def db_is_empty(db_path):
        # Check if chroma sqlite file exists and is > 0 bytes
        sqlite_file = os.path.join(db_path, "chroma.sqlite3")
        return not os.path.exists(sqlite_file) or os.path.getsize(sqlite_file) == 0

    emb = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
    
    if db_is_empty(DB_DIR) is False:
        # Load existing DB (no re-embedding)
        return Chroma(
            persist_directory=DB_DIR,
            embedding_function=emb
        )
    
    # First-time: create DB
    print("first time creating the vec store")
    chunks = load_and_chunk()
    db = Chroma.from_documents(
        documents=chunks,
        embedding=emb,
        persist_directory=DB_DIR
    )
    
    return db


# Initialize
db = init_vectorstore()
retriever = db.as_retriever(search_kwargs={"k": 1}) # how much to retrive

# Format documents for the prompt
def format_docs(docs):
    """Format retrieved documents into a string."""
    return "\n\n".join(
        f"Source: {doc.metadata.get('source', 'Unknown')}\n{doc.page_content}"
        for doc in docs
    )


# This is what will be used! 
def ask(query: str) -> str: 
    """Simple call for external modules (like narrator)."""
    docs = retriever.invoke(query)
    return docs

#print(ask("i love dragons"))