"use client";

import { createContext, ReactNode, useState } from "react";
import { Gender, Race } from "./types";

interface GameApiContextType {
  fetchRaces: () => Promise<Race[]>;
  fetchGenders: () => Promise<Gender[]>;
  joinGame: (data: any) => Promise<void>;
  playerID: string;
}

export const GameApiContext = createContext<GameApiContextType | undefined>(undefined);

export function GameApiProvider({ children }: { children: ReactNode }) {
  const [playerID, setPlayerID] = useState("");

  const fetchRaces = async () => {
    const res = await fetch("/api/races");
    return res.json();
  };

  const fetchGenders = async () => {
    const res = await fetch("/api/genders");
    return res.json();
  };

  const joinGame = async (data: any) => {
    console.log("JOINING GAME....");
    console.log("Data", data);
    const res = await fetch("http://localhost:8000/join", { method: "POST", body: JSON.stringify(data) });
    const res_data = await res.json();
    setPlayerID(res_data.player_id);
    console.log("Response,", res_data);
  };

  return (
    <GameApiContext.Provider value={{ fetchRaces, fetchGenders, joinGame, playerID}}>
      {children}
    </GameApiContext.Provider>
  );
}
