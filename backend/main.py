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

import asyncio
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
from models.router import InputRouter
from models.state import run_state_management

# Importing schemas / models.
from schemas import PlayerMessage, JoinRequest, PlayerCreate, WebsocketDataPacket

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
    data_packet: WebsocketDataPacket = {  # check schema for WebsocketDataPacket
        "sender": "system",
        "type": "system",
        "message": f"Player {player_id} connected successfully!",
    }
    await ws_manager.private_message(player_id, data_packet)
    # The websocket session
    try:
        while True:
            raw_data = await websocket.receive_text()

            data = json.loads(raw_data)
            data_message = data.get("message")
            data_sender_id = data.get("pid")  # the player ID sending the message

            # LLM determines the type of message (action, world)
            router = InputRouter()
            data_type = router.classify(data_message)
            
            world_model = WorldModel()
            narrator = Narrator()

            # Handles player question / world query
            if data_type == "world":
                print("World query detected.")
                answer = world_model.generate(player_id, data_message)
                data_packet: WebsocketDataPacket = {
                    "sender": "narrator",
                    "type": "world",
                    "message": answer,
                }
                await ws_manager.private_message(player_id, data_packet) # sends resonse ONLY to asking player

            # Handles player action
            elif data_type == "action":
                print("Action detected.")
                all_messages = game_session.add_message(data_sender_id, data_message)
                data_packet: WebsocketDataPacket = {
                    "sender": data_sender_id,
                    "type": "action",
                    "message": data_message,
                }
                await ws_manager.broadcast_message(data_packet)
                if all_messages:
                    # TODO: Ping frontend so we can display feedback. Takes some time to run the LLM.

                    current_player_data = get_player(player_id) or {}
                    completed_quests_list = current_player_data.get(
                        "completed_quests", []
                    )

                    active_quests_list = []

                    for q_id, q_info in QUEST_DEFINITIONS.items():

                        if q_id in completed_quests_list:
                            continue

                        prereqs = q_info.get("prerequisites", [])

                        are_prereqs_met = True
                        for p_id in prereqs:
                            if p_id not in completed_quests_list:
                                are_prereqs_met = False
                                break

                        if are_prereqs_met:
                            active_quests_list.append(q_info)

                    game_session.set_all_players_status("narrator_thinking")
                    await asyncio.sleep(1)

                    narrator_message = narrator.generate(
                        session_id="session_1",
                        game_state={"player_messages": all_messages},
                        quests_data=active_quests_list,
                    )

                    run_state_management()  # updates the game state based on the actions taken by players

                    completed_quests = get_player_completed_quests(player_id)
                    current_player = get_player(player_id)

                    if current_player is None:
                        current_player = {}

                    current_location = current_player.get("position", "startingVillage")

                    qm = QuestManager(QUEST_DEFINITIONS)

                    newly_completed_ids = qm.check_progress(
                        player_location=current_location,
                        completed_quests_ids=completed_quests,
                        narration=narrator_message,
                        player_action=data_message,
                    )

                    if newly_completed_ids:

                        quest_names = []
                        for qid in newly_completed_ids:
                            add_completed_quest(player_id, qid)

                            q_title = QUEST_DEFINITIONS[qid]["title"]
                            quest_names.append(q_title)

                        await ws_manager.private_message(
                            player_id,
                            {
                                "sender": "System",
                                "type": "system",
                            },
                        )

                    game_session.new_turn()
                    game_session.set_all_players_status("waiting") 
                    data_packet = {
                        "sender": "narrator",
                        "type": "narration",
                        "message": narrator_message,
                    }
                    await ws_manager.broadcast_message(data_packet)
                    save_to_file()  # saves conversation to file
            else:
                data_packet: WebsocketDataPacket = {
                    "sender": "system",
                    "type": "system",
                    "message": "Something went wrong when handling response in the server...",
                }
                await ws_manager.private_message(player_id, data_packet)

    except WebSocketDisconnect as e:
        print("WebSocket disconnected:", e)
        await ws_manager.disconnect(player_id)
    except Exception as e:
        print("Error occured: ", e)
        await ws_manager.disconnect(player_id)
        try:
            await websocket.close(code=1011)
        except RuntimeError:
            # Socket might already be closed; ignore double-close errors
            pass


@app.get("/")
async def root():
    return {"message": "Server running"}


@app.get("/startgame")
async def start_game():
    data_packet: WebsocketDataPacket = {
        "sender": "system",
        "type": "startgame",
        "message": "Something went wrong when handling response in the server...",
    }
    await ws_manager.broadcast_message(data_packet)

    # After game has started, sends out narrator's first message.
    data_packet: WebsocketDataPacket = {
        "sender": "narrator",
        "type": "narration",
        "message": "Welcome to the world of magic, wonder and adventure! You are all currently in the Starting Village. Here you can smell the fresh breeze from the sea, hear the blacksmith hammer echo through the narrow streets and feel the warming comfort of the sun. However, the townsfolk are wary, rumours of a dark wizard has spread throughout the town. Your quest is to stop the dark wizard! It is said that he lives in an obsidian tower, beyond the enchanted forest to the west. But it has also been rumours that the old passage through the Rocky Hills will lead you straight to the Dark wizard. Be cautious though, because the enchanted forest is know for its deception, and at night the screems of Ghouls can be heard from the Rocky Hills. Your quest starts here. What do you want to do?",
    }
    await ws_manager.broadcast_message(data_packet)


@app.get("/session")
async def get_sesssion():
    return game_session


@app.get("/players")
async def players():
    # Get session status (waiting, etc.)
    session_players = game_session.get_players()
    
    # Get persistent state (hp, items)
    db_players_list = get_all_players()
    db_players_map = {p["id"]: p for p in db_players_list}
    
    # Merge
    merged_players = {}
    for pid, s_player in session_players.items():
        db_p = db_players_map.get(pid, {})
        merged_players[pid] = {
            **s_player, # name, race, gender, status
            "hp": db_p.get("hp", 100),
            "items": db_p.get("items", [])
        }
        
    return {"players": merged_players}


# Saves data in databse to a local file in the backend
@app.get("/save")
async def save_data():
    save_to_file()
    return {"message": "Data saved."}


@app.get("/turn")
async def turn():
    return {"turn": game_session.turn}


@app.post("/join")
async def join(request: JoinRequest):

    name = request.name
    race = request.race
    gender = request.gender

    # request contains a JSON with the data
    pid = game_session.add_player(name=name, race=race, gender=gender)

    new_player_data = { # TODO: correct type
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
    game_session.delete_player(player_id)

    was_deleted = delete_player(player_id)

    if not was_deleted:
        raise HTTPException(
            status_code=404, detail=f"Player {player_id} not found in database."
        )

    return {
        "message": f"Player {player_id} removed successfully from session and database."
    }


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
