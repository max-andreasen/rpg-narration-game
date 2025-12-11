
"""
WEBSOCKET MANAGER, 
    Seperate from the game session. This just keeps track of the clients
    connected to the server. Handles connection, disconnect, private messages, 
    as well as broadcasting messages.
"""

from schemas import WebsocketDataPacket
from fastapi import WebSocket
import json

class WebsocketManager():
    def __init__(self):
        self.active_connections = {}
    
    async def connect(self, player_id, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[player_id] = websocket
    
    async def disconnect(self, player_id):
        self.active_connections.pop(player_id, None)
    
    async def broadcast_message(self, data_packet: WebsocketDataPacket):
        print("Sending messages to all players...")
        for ws in self.active_connections.values():
            await ws.send_text(json.dumps(data_packet))
    
    async def private_message(self, player_id, data_packet: WebsocketDataPacket):
        ws = self.active_connections[player_id]
        await ws.send_text(json.dumps(data_packet))
    
ws_manager = WebsocketManager()
