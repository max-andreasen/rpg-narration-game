# test_game.py
import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app, game_session, ws_manager
from websockets import connect

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_session():
    game_session.clear_session()
    ws_manager.active_connections.clear()
    yield
    game_session.clear_session()
    ws_manager.active_connections.clear()


def test_join_endpoint():
    response = client.post("/join")
    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    assert len(data["players"]) == 1


def test_add_message_waiting_for_players():
    # join 1 player
    response = client.post("/join")
    player_id = response.json()["players"][0]
    # send message
    response = client.post("/message", json={"player_id": player_id, "message": "Hello"})
    assert response.status_code == 200
    assert response.json()["message"] == "Waiting for players..."


def test_full_turn_flow():
    # join two players
    pid1 = client.post("/join").json()["players"][0]
    pid2 = client.post("/join").json()["players"][1]

    # player 1 sends message
    resp1 = client.post("/message", json={"player_id": pid1, "message": "Hi"})
    assert resp1.status_code == 200
    assert resp1.json()["message"] == "Waiting for players..."

    # player 2 sends message
    resp2 = client.post("/message", json={"player_id": pid2, "message": "Hello"})
    # Now all players have submitted
    assert resp2.status_code == 200
    assert resp2.json()["message"] == "Moving on to next turn!"
    assert game_session.turn == 1
    assert game_session.messages == {}


@pytest.mark.asyncio
async def test_websocket_connection():
    # join a player first
    pid = client.post("/join").json()["players"][0]

    uri = f"ws://localhost:8000/ws?player_id={pid}"
    async with connect(uri) as websocket:
        # receive connection success
        msg = await websocket.recv()
        assert f"Player {pid} connected successfully!" in msg
        # send a message
        await websocket.send("Test")
        reply = await websocket.recv()
        assert "Received data Test" in reply
