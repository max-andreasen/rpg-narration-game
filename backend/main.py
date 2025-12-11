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
import asyncio
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
from models.narrator import Narrator
from models.world_model import WorldModel
from models.state import run_state_management

# Importing schemas / models.
from schemas import PlayerMessage, JoinRequest, PlayerCreate

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",  # please leave here, I need it for testing frontend
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
            "type": "world", # should be system when implemented in frontend
            "message": f"Player {player_id} connected successfully!"
        })
    )
    # The websocket session
    try:
        while True:
            # Waiting for client to send data
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            
            # TODO: Refactor this into its own module that takes data as input and generates response object as output.

            data_type = data.get("type")
            data_message = data.get("message")
            data_sender_id = data.get("pid") # the player ID sending the message

            world_model = WorldModel()
            narrator = Narrator()

            # Sends data to LLMs
            if data_type == "world":
                # TODO: Maybe add this conversation to some history. It is already kept in frontend though. 
                # TODO: Fetch the player state / game state, so the model has context. 
                # TODO: Invoke the narrator, with question mode. 
                # TODO: Send a private message back with type "world"
                narrator_message = "I am an LLM supposed to answer your question.. Please connect me!"
                await ws_manager.private_message(
                    player_id,
                    json.dumps({
                        "type": "world",
                        "message": narrator_message
                    })
                )
            elif data_type == "action":
                all_messages = game_session.add_message(data_sender_id, data_message)
                if all_messages: 
                    # TODO: Ping frontend so we can display feedback. Takes some time to run the LLM.
                    game_session.set_all_players_status("narrator_thinking")
                    await asyncio.sleep(1) # Give frontend time to update
                    narrator_message = narrator.generate("session_1", {"player_messages": all_messages})
                    run_state_management() # updates the game state based on the actions taken by players
                    game_session.new_turn()
                    game_session.set_all_players_status("waiting")
                    await ws_manager.broadcast_message(
                        json.dumps({
                            "type": "action",
                            "message": narrator_message
                        })
                    )
            else:                     
                # Sends response back to the client
                await ws_manager.private_message(
                    player_id,
                    json.dumps({
                        "type": "system",
                        "message": "Something went wrong..."
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

@app.get("/players")
async def players():
    players = game_session.get_players()
    return {"players": players}


@app.post("/join")
async def join(request: JoinRequest):

    name = request.name
    race = request.race
    gender = request.gender

    # req contains a JSON with the data
    pid = game_session.add_player(name=name, race=race, gender=gender)

    print("Player assigned ID: ", pid)

    new_player_data = {
        "id": pid,
        "name": name,
        "race": race,
        "gender": gender,
        "starting_item": request.startingItem,
        "items": [request.startingItem],
        "hp": 100,
        "position": "startingVillage",
    }

    try:
        add_player(new_player_data)
        print(f"Player {pid} saved in MongoDB database.")
    except Exception as e:
        print(f"Database save error: {e}")

    return {"player_id": pid, "players": list(game_session.players)}


@app.post("/remove")
async def remove_player(player_id):
    # TODO: Remove player from database as well. 
    game_session.delete_player(player_id)


@app.get("/reset")
async def reset_session():
    game_session.clear_session()
    clear_db()
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
