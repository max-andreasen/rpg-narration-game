"use client";

import { createContext, ReactNode, useState, useEffect } from "react";
import { Gender, Race } from "./types";

interface GameApiContextType {
  connected: boolean;
  playerID: string | null;
  joinGame: (data: any) => Promise<void>;
  fetchRaces: () => Promise<Race[]>;
  fetchGenders: () => Promise<Gender[]>;

  sendMessage: (type: "action" | "world" | "system", msg: string) => void;

  addWorldMessage: (msg: string) => void;
  addActionMessage: (msg: string) => void;
  worldHistory: string[];
  actionHistory: string[];
}

export const GameApiContext = createContext<GameApiContextType | undefined>(undefined);

export function GameApiProvider({ children }: { children: ReactNode }) {
  const [playerID, setPlayerID] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [worldHistory, setWorldHistory] = useState<string[]>([]);
  const [actionHistory, setActionHistory] = useState<string[]>([]);
  const [systemHistory, setSystemHistory] = useState<string[]>([]); // will be used later to implement system messages, such as "player joined game".

  // Fetches data from the backend about the game. 
  const fetchRaces = async () => {
    const res = await fetch("/api/races");
    return res.json();
  };

  const fetchGenders = async () => {
    const res = await fetch("/api/genders");
    return res.json();
  };


  // JOINING THE GAME.
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


  // WEBSOCKET LOGIC
  useEffect(() => {
    if (!playerID) {
      setWs(null);
      return;
    }
    const socket = new WebSocket(`ws://localhost:8000/ws?player_id=${playerID}`);

    socket.onopen = () => setConnected(true);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "world") setWorldHistory(prev => [...prev, data.message]);
        else if (data.type === "action") setActionHistory(prev => [...prev, data.message]);
        else console.warn("Unknown message type:", data.type);

      } catch (err) {
        console.error("Failed to parse WS message:", event.data, err);
      }
    };

    socket.onclose = () => setConnected(false);
    socket.onerror = (err) => console.error("WebSocket error:", err);

    setWs(socket);
    return () => socket.close();
  }, [playerID]);
 
  // CHAT LOGIC
  const sendMessage = (type: "action" | "world" | "system", msg: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ type, message: msg });
      console.log("Sending WS message...", payload);
      ws.send(msg);
      if (type="world") { 
        addWorldMessage(msg);
      } else if (type="action") {
        addActionMessage(msg);
      } else {
        console.warn("Type is not valid");
      }
    } else {
      console.warn("WebSocket not connected yet. Message not recieved");
    }
  };

  // Keeps history of chat. Needed? 
  const addWorldMessage = (msg: string) => {
    setWorldHistory(prev => [...prev, msg]);
  };

  const addActionMessage = (msg: string) => {
    setActionHistory(prev => [...prev, msg]);
  };

  return (
    <GameApiContext.Provider value={{ 
      connected,
      playerID, 
      joinGame, 
      fetchRaces, 
      fetchGenders, 
      sendMessage,
      addWorldMessage, 
      addActionMessage,
      worldHistory, 
      actionHistory
    }}>
      {children}
    </GameApiContext.Provider>
  );
}
