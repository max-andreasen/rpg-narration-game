from pydantic import BaseModel

class JoinRequest(BaseModel):
    race: str
    gender: str
    startingItem: str

class PlayerMessage(BaseModel):
    player_id: str
    message: str
