from pydantic import BaseModel
from typing import List, Union


class JoinRequest(BaseModel):
    race: str
    gender: str
    startingItem: str
    description: str

class PlayerMessage(BaseModel):
    player_id: str
    message: str

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