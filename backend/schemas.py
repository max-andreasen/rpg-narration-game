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


class GameState(BaseModel):
    narrator_output: str
    player_messages: dict

class LocationState(BaseModel): # Not used currently but could be useful later
    description: str
    canGoTo: list[str]
    items: List[str]
    npcs: List[str]

class MapState(BaseModel):
    locations: dict[str, LocationState]

class NPCState(BaseModel):
    description: str
    location: str
    hp: int
    evilness: int

class CharacterState(BaseModel):
    characters : dict[str, NPCState]

class ItemState(BaseModel):
    description: str # How it looks
    effect: str # what it does
    location: str
    damage: int

class ItemsState(BaseModel):
    items: dict[str, ItemState]
