"use client";

import { createContext, ReactNode, useState, useEffect } from "react";
import { Gender, Race } from "./types";

interface GameApiContextType {
  connected: () => boolean;
  reconnect: () => boolean;

  playerID: string | null;
  joinGame: (data: any) => Promise<void>;
  reset: () => void;
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
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [worldHistory, setWorldHistory] = useState<string[]>([]);
  const [actionHistory, setActionHistory] = useState<string[]>([]);
  const [systemHistory, setSystemHistory] = useState<string[]>([]); // will be used later to implement system messages, such as "player joined game".

  const [actionAvailable, setActionAvailable] = useState(false); // can only make one action each turn

  // Fetches data from the backend about the game. 
  const fetchRaces = async () => {
    // TODO: Update backend to provide this (not needed for MVP)
    const res = await fetch("/api/races");
    return res.json();
  };

  const fetchGenders = async () => {
    // TODO: Update backend to provide this (not needed for MVP)
    const res = await fetch("/api/genders");
    return res.json();
  };

  // JOINING THE GAME.
  const joinGame = async (data: any) => {
    console.log("Joining the game...");
    const res = await fetch("http://localhost:8000/join", { 
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });
    const res_data = await res.json();
    setPlayerID(res_data.player_id);
    localStorage.setItem("playerID", res_data.player_id);
    console.log(`Player with ID ${res_data.player_id} joined the game.`);
  };

  const reset = async () => {
    // Reset the local states 
    setPlayerID(null);
    setWorldHistory([]);
    setActionHistory([]);
    setSystemHistory([]);
    setWs(null);
    
    const res = await fetch("http://localhost:8000/reset");
    localStorage.clear();

    if (res.status == 200) {
      console.log("Game session reset successfully.");
      return
    }
    console.error("Something went wrong when resetting the game session");
  };

  // RECONNECTION LOGIC
  // Returns true if the websocket is connected and playerID exists
  const connected = (): boolean => {
    return ws !== null && ws.readyState === WebSocket.OPEN && playerID !== null;
  };

  const reconnect = (): boolean => {
    const storedPlayerID = localStorage.getItem("playerID");
    if (!storedPlayerID || storedPlayerID == null) {
      console.log("Recconection failed, playerID: ", playerID);
      return false; // needs to join game again with new data, since it is not stored.
    } 
    const storedActionHistory = JSON.parse(localStorage.getItem("actionHistory") || "[]"); 
    const storedWorldHistory = JSON.parse(localStorage.getItem("worldHistory") || "[]"); 
    setPlayerID(storedPlayerID); // also triggers the useEffect, which establishes a new websocket connection.
    setActionHistory(storedActionHistory);
    setWorldHistory(storedWorldHistory);
    return true;
    // TODO: Probably want to extract more info later, like which turn it is etc.
  };

  // WEBSOCKET LOGIC
  useEffect(() => {
    if (!playerID) {
      setWs(null);
      return;
    }
    const socket = new WebSocket(`ws://localhost:8000/ws?player_id=${playerID}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "world") addWorldMessage(data.message);
        else if (data.type === "action") addActionMessage(data.message);
        else console.warn("Unknown message type:", data.type);

      } catch (err) {
        console.error("Failed to parse WS message:", event.data, err);
      }
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);

    setWs(socket);
    console.log("Connected successfully to websocket.");
    return () => socket.close();
  }, [playerID]);
 
  // CHAT LOGIC
  const sendMessage = (type: "action" | "world" | "system", msg: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ pid: playerID, type: type, message: msg });
      ws.send(payload);
      if (type == "world") { 
        addWorldMessage(msg);
      } else if (type == "action") {
        addActionMessage(msg);
      } else {
        console.warn("Type is not valid");
      }
    } else {
      console.warn("WebSocket not connected yet. Message not recieved");
    }
  };

  // Keeps history of chat.
  const addWorldMessage = (msg: string) => {
    setWorldHistory(prev => {
      const updated = [...prev, msg];
      localStorage.setItem("worldHistory", JSON.stringify(updated));
      return updated;
    });
  };
  const addActionMessage = (msg: string) => {
    setActionHistory(prev => {
      const updated = [...prev, msg];
      localStorage.setItem("actionHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const endTurn = () => {
    // TODO: Add additional info to localStorage
    // localStorage only stores strings, need to stringify the lists / arrays
  }

  return (
    <GameApiContext.Provider value={{ 
      connected,
      reconnect,
      playerID, 
      joinGame, 
      reset,
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
