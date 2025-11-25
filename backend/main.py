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

from fastapi import FastAPI
from pydantic import BaseModel
from session import game_session
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from db.mongodb import *

app = FastAPI()


class PlayerMessage(BaseModel):
    player_id: str
    message: str


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
        game_session.new_turn()
        return {"message": "Moving on to next turn!"}
    return {"message": "Waiting for players..."}


@app.post("/join")
async def join():
    pid = game_session.generate_player_id()
    game_session.players.add(pid)
    return {"players": list(game_session.players)}


@app.post("/rejoin")
async def join(player_id):
    return "rejoin"


@app.post("/remove")
async def remove_player(player_id):
    game_session.delete_player(player_id)


@app.get("/clear")
async def clear_session():
    game_session.clear_session()
