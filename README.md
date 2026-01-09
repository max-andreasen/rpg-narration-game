# ⚔️ RPG Narration Game

> A real-time, AI-narrated Role Playing Game powered by LLMs and WebSocket technology.

<!-- 
  🎥 VIDEO PLACEHOLDER 
  Upload your video to the repo or host it (e.g., YouTube) and replace the link below.
  Example: [![Demo Video](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
-->

https://github.com/user-attachments/assets/da08cd59-3940-485a-b8c2-dc88af54c297


---

## 📖 Overview

Dive into an immersive RPG experience where the story evolves in real-time. This project leverages **FastAPI** for a robust backend and **Next.js** for a reactive frontend. Using **LangChain** and **RAG (Retrieval-Augmented Generation)**, the AI narrator weaves unique storylines based on player actions, maintaining world consistency through vector databases.

## ✨ Features

- **🧠 AI Narrator:** Dynamic storytelling powered by OpenAI & LangChain.
- **⚡ Real-time Gameplay:** WebSocket integration for instant updates and multiplayer interaction.
- **📚 Context Aware:** Uses RAG (Vector DB) to remember characters, items, and places.
- **🎨 Interactive UI:** Built with Next.js 16 and styled with Tailwind CSS v4.
- **💾 Persistent World:** MongoDB storage for characters, quests, and world states.

## 🛠️ Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-0.4-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb)
![LangChain](https://img.shields.io/badge/LangChain-AI-1C3C3C?style=flat-square&logo=chainlink)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.10+)
- **MongoDB** (Running locally or a cloud instance)
- **OpenAI API Key**

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
MONGO_URL=mongodb://localhost:27017/yourdb
OPENAI_API_KEY=sk-...
```

### 2. Install Dependencies

**Backend:**
```bash
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Run the Application

**Start Backend:**
```bash
# From root directory
fastapi dev backend/main.py
```
_Backend runs on: `http://localhost:8000`_

**Start Frontend:**
```bash
# In a new terminal, from /frontend directory
cd frontend
npm run dev
```
_Frontend runs on: `http://localhost:3000`_

### 4. Optional: Remote Access (ngrok)

To allow other players to join your local server:

1.  Install [ngrok](https://ngrok.com/).
2.  Expose your frontend:
    ```bash
    ngrok http 3000
    ```
3.  Share the **Forwarding** URL with players.
    > *Note: Ensure your backend is running locally.*

---

## 📂 Project Structure

```bash
├── 📂 backend/         # FastAPI application, Game Logic, RAG
│   ├── 📂 db/          # MongoDB & Vector DB handling
│   ├── 📂 models/      # Pydantic models & LangChain logic
│   └── 📄 main.py      # Entry point
├── 📂 frontend/        # Next.js Application
│   ├── 📂 app/         # App Router & Views
│   └── 📂 components/  # React Components
└── 📄 requirements.txt # Python dependencies
```
