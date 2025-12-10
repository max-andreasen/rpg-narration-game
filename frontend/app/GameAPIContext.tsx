"use client";

import { createContext, ReactNode, useState, useEffect } from "react";
import { Gender, Race, Player } from "./types";

type Message = {
  sender: "player" | "narrator";
  message: string;
};

interface GameApiContextType {
  connected: () => boolean;
  reconnect: () => boolean;

  playerID: string | null;
  name: string | null;
  race: string | null;
  gender: string | null;
  players: Player[];
  joinGame: (data: any) => Promise<void>;
  reset: () => void;
  fetchRaces: () => Promise<Race[]>;
  fetchGenders: () => Promise<Gender[]>;

  sendMessage: (type: "action" | "world" | "system", msg: string) => void;

  worldHistory: Message[];
  actionHistory: Message[];
}

export const GameApiContext = createContext<GameApiContextType | undefined>(
  undefined
);

export function GameApiProvider({ children }: { children: ReactNode }) {
  const [playerID, setPlayerID] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [race, setRace] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [worldHistory, setWorldHistory] = useState<Message[]>([]);
  const [actionHistory, setActionHistory] = useState<Message[]>([]);
  const [systemHistory, setSystemHistory] = useState<string[]>([]); // will be used later to implement system messages, such as "player joined game".

  const [actionAvailable, setActionAvailable] = useState(false); // can only make one action each turn

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch("http://localhost:8000/players");
      console.log("Fetched player:", res);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players);
      } else {
        console.error("Failed to fetch players");
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };
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
      body: JSON.stringify(data),
    });
    const res_data = await res.json();
    setPlayerID(res_data.player_id);
    setName(data.name);
    setRace(data.race);
    setGender(data.gender);
    localStorage.setItem("playerID", res_data.player_id);
    localStorage.setItem("name", data.name);
    localStorage.setItem("race", data.race);
    localStorage.setItem("gender", data.gender);
    console.log(`Player with ID ${res_data.player_id} joined the game.`);
    fetchPlayers();
  };

  const reset = async () => {
    // Reset the local states
    setPlayerID(null);
    setName(null);
    setRace(null);
    setGender(null);
    setWorldHistory([]);
    setActionHistory([]);
    setSystemHistory([]);
    setPlayers([]);
    setWs(null);

    const res = await fetch("http://localhost:8000/reset");
    localStorage.clear();

    if (res.status == 200) {
      console.log("Game session reset successfully.");
      return;
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
    const storedName = localStorage.getItem("name");
    const storedRace = localStorage.getItem("race");
    const storedGender = localStorage.getItem("gender");
    if (!storedPlayerID || storedPlayerID == null) {
      console.log("Recconection failed, playerID: ", playerID);
      return false; // needs to join game again with new data, since it is not stored.
    }
    const storedActionHistory = JSON.parse(
      localStorage.getItem("actionHistory") || "[]"
    );
    const storedWorldHistory = JSON.parse(
      localStorage.getItem("worldHistory") || "[]"
    );
    setPlayerID(storedPlayerID); // also triggers the useEffect, which establishes a new websocket connection.
    setName(storedName);
    setRace(storedRace);
    setGender(storedGender);
    setActionHistory(storedActionHistory);
    setWorldHistory(storedWorldHistory);
    fetchPlayers();
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
        const data = JSON.parse(event.data); // TODO: Check correct type here? 
        const message_type = data.type;
        const sender = data.sender; // sender can be player_id, "narrator" or "system"

        if (data.type === "narration")
          addWorldMessage({ sender: "narrator", message: data.message });
        else if (data.type === "action")
          addActionMessage({ sender: "narrator", message: data.message });
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
      const payload = JSON.stringify({
        pid: playerID,
        type: type,
        message: msg,
      });
      ws.send(payload);
      const message: Message = { sender: "player", message: msg };
      if (type == "world") {
        addWorldMessage(message);
      } else if (type == "action") {
        addActionMessage(message);
      } else {
        console.warn("Type is not valid");
      }
    } else {
      console.warn("WebSocket not connected yet. Message not recieved");
    }
  };

  // Keeps history of chat.
  const addWorldMessage = (msg: Message) => {
    setWorldHistory((prev) => {
      const updated = [...prev, msg];
      localStorage.setItem("worldHistory", JSON.stringify(updated));
      return updated;
    });
  };
  const addActionMessage = (msg: Message) => {
    setActionHistory((prev) => {
      const updated = [...prev, msg];
      localStorage.setItem("actionHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const endTurn = () => {
    // TODO: Add additional info to localStorage
    // localStorage only stores strings, need to stringify the lists / arrays
  };

  return (
    <GameApiContext.Provider
      value={{
        connected,
        reconnect,
        playerID,
        name,
        race,
        gender,
        players,
        joinGame,
        reset,
        fetchRaces,
        fetchGenders,
        sendMessage,
        worldHistory,
        actionHistory,
      }}
    >
      {children}
    </GameApiContext.Provider>
  );
}
