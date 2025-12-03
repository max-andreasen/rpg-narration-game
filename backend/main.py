"""
Create the FastAPI app
Include the router.
Initialize DB connections.

(might want to refactor into seperate game file?)
When user sends a request for a response from the narrator,
this file handles the flow. Calls the narrator.py (model),
uses that output as a response to the clients. Also calls
the other model (state_management.py) which handles the states.
"""

from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from session import game_session
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from pydantic import BaseModel, Field
from db.mongodb import *
from websocket_manager import ws_manager
from fastapi.websockets import WebSocketDisconnect
import json

from session import game_session

# Importing schemas / models.
from schemas import PlayerMessage, JoinRequest, PlayerCreate

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def player_action_message(payload: PlayerMessage):
    try:
        last_message = game_session.add_message(payload.player_id, payload.message)
        # save message to db here

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if last_message:
        await ws_manager.broadcast_message(payload.message)
        await ws_manager.broadcast_message("Moving on to next turn...")
        game_session.new_turn()
        return {"message": "Moving on to next turn!"}
    return {"message": "Waiting for players..."}


# Websocket endpoint just handles websocket connection to clients. Seperate from game session.
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    # Websocket set-up
    player_id = websocket.query_params.get("player_id")
    if not player_id:
        await websocket.close(code=4000)
        return
    if player_id not in game_session.get_players():
        await websocket.close(code=1003)
        return
    await ws_manager.connect(player_id, websocket)
    await ws_manager.private_message(
        player_id,
        json.dumps({
            "type": "world",
            "message": f"Player {player_id} connected successfully!"
        })
    )
    # The websocket session
    try:
        while True:
            # Waiting for client to send data
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            
            data_type = data.get("type")
            data_message = data.get("message")

            print(data_type)

            # Sends data to LLMs
            if data_type == "world":
                message = "I am an LLM supposed to answer your question.. Please connect me!"
            elif data_type == "action":
                message = "I am the narrator. I am here to determine what happens next. Connect me please!" 
            else:
                message = "Something went wrong..."
            
            # Sends response back to the client
            await ws_manager.private_message(
                player_id,
                json.dumps({
                    "type": data_type,
                    "message": message
                })
            )
    except Exception as e:
        print("Error occured: ", e)
        await ws_manager.disconnect(player_id)
        await websocket.close(code=1011)


@app.get("/")
async def root():
    return {"message": "Server running"}


@app.get("/session")
async def get_sesssion():
    return game_session

@app.post("/join")
async def join(request: JoinRequest):
    # req contains a JSON with the data
    pid = game_session.generate_player_id()
    game_session.players.add(pid)
    return {
        "player_id": pid,
        "players": list(game_session.players)}


@app.post("/rejoin")
async def join(player_id):
    return "rejoin"


@app.post("/remove")
async def remove_player(player_id):
    game_session.delete_player(player_id)


@app.get("/clear")
async def clear_session():
    game_session.clear_session()
    return {"message": "Session cleared successfully!"}


@app.post("/add_player")
async def add_new_player(player_data: PlayerCreate):
    try:
        add_player(player_data.model_dump())
        return JSONResponse(
            content={"message": "Player added successfully"}, status_code=201
        )
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
