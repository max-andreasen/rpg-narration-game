"use client";

import { createContext, ReactNode, useState } from "react";
import { Gender, Race } from "./types";

interface GameApiContextType {
  connected: boolean;
  playerID: string | null;
  joinGame: (data: any) => Promise<void>;
  fetchRaces: () => Promise<Race[]>;
  fetchGenders: () => Promise<Gender[]>;
  sendMessage: null; //TODO 
}

export const GameApiContext = createContext<GameApiContextType | undefined>(undefined);

export function GameApiProvider({ children }: { children: ReactNode }) {
  const [playerID, setPlayerID] = useState("");
  const [connected, setConnected] = useState(false);

  const fetchRaces = async () => {
    const res = await fetch("/api/races");
    return res.json();
  };

  const fetchGenders = async () => {
    const res = await fetch("/api/genders");
    return res.json();
  };

  const joinGame = async (data: any) => {
    const res = await fetch("http://localhost:8000/join", { 
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });
    const res_data = await res.json();
    setPlayerID(res_data.player_id);
    console.log(`Player with ID ${res_data.player_id} joined the game.`);
  };
 
  const sendMessage = null; //TODO

  return (
    <GameApiContext.Provider value={{ connected, playerID, joinGame, fetchRaces, fetchGenders, sendMessage}}>
      {children}
    </GameApiContext.Provider>
  );
}
