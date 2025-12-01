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
from typing import List, Union
from db.mongodb import *
from websocket_manager import ws_manager
from fastapi.websockets import WebSocketDisconnect

from session import game_session

# Importing schemas / models.
from schemas import PlayerMessage, JoinRequest

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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

class PlayerCreate(BaseModel):
    id: str
    name: str
    race: str
    gender: str
    items: List[str]
    starting_item: str
    position: Union[dict, str]
    hp: Union[int, float]
    character_description: str


    # Setting up the connection with an already existing player id
    player_id = websocket.query_params.get("player_id")
    if not player_id:
        await websocket.close(code=4000)
        return
    if player_id not in game_session.get_players():
        await websocket.close(code=1003)
        return

    await ws_manager.connect(player_id, websocket)
    await ws_manager.private_message(player_id, f"Player {player_id} connected successfully!")

    try:
        while True:
            data = await websocket.receive_text()
            await ws_manager.private_message(player_id, f"Received data {data}")
    except WebSocketDisconnect:
        # client closed the connection normally
        ws_manager.disconnect(player_id)
        print(f"Player {player_id} disconnected")
    except Exception as e:
        # handle other errors without closing the websocket again
        ws_manager.disconnect(player_id)
        print(f"Error for player {player_id}: {e}")


# Websocket endpoint just handles websocket connection to clients. Seperate from game session.
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    # Setting up the connection with an already existing player id
    player_id = websocket.query_params.get("player_id")
    if not player_id:
        await websocket.close(code=4000)
        return
    if player_id not in game_session.get_players():
        await websocket.close(code=1003)
        return
    await ws_manager.connect(player_id, websocket)
    await ws_manager.private_message(
        player_id, f"Player {player_id} connected successfully!"
    )

    # The websocket session
    try:
        while True:
            # Waiting for client to send data
            data = await websocket.receive_text()
            # Sends cofirmation back to the client
            await ws_manager.private_message(player_id, f"Received data {data}")
    except Exception:
        ws_manager.disconnect(player_id)
        await websocket.close(code=1011)


@app.get("/")
async def root():
    return {"message": "Server running"}


@app.get("/session")
async def get_sesssion():
    return game_session


@app.post("/message")
async def send_message(payload: PlayerMessage):
    try:
        response = game_session.add_message(payload.player_id, payload.message)
        # save message to db here

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if response:
        await ws_manager.broadcast_message(payload.message)
        await ws_manager.broadcast_message("Moving on to next turn...")
        game_session.new_turn()
        return {"message": "Moving on to next turn!"}
    return {"message": "Waiting for players..."}


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
