"use client";

import { createContext, ReactNode, useState, useEffect } from "react";
import { Gender, Race } from "./types";

interface GameApiContextType {
  connected: boolean;
  playerID: string | null;
  joinGame: (data: any) => Promise<void>;
  fetchRaces: () => Promise<Race[]>;
  fetchGenders: () => Promise<Gender[]>;
  sendMessage: (msg: string) => void;
}

export const GameApiContext = createContext<GameApiContextType | undefined>(undefined);

export function GameApiProvider({ children }: { children: ReactNode }) {
  const [playerID, setPlayerID] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

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

  // ALL WEBSOCKET LOGIC
  useEffect(() => {
    if (!playerID) return;

    const socket = new WebSocket(`ws://localhost:8000/ws?player_id=${playerID}`);

    socket.onopen = () => setConnected(true);
    socket.onmessage = (event) => setMessages(prev => [...prev, event.data]);
    socket.onclose = () => setConnected(false);
    socket.onerror = (err) => console.error("WebSocket error:", err);

    setWs(socket);

    return () => socket.close();
  }, [playerID]);
 
  const sendMessage = (msg: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("Sending WS message...");
      ws.send(msg);
    } else {
      console.warn("WebSocket not connected yet");
    }
  };

  return (
    <GameApiContext.Provider value={{ connected, playerID, joinGame, fetchRaces, fetchGenders, sendMessage}}>
      {children}
    </GameApiContext.Provider>
  );
}
