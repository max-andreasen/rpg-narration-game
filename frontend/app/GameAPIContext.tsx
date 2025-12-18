"use client";

import { createContext, ReactNode, useState, useEffect } from "react";
import { Gender, Race, Player, ChatMessage } from "./types";

interface GameApiContextType {
  connected: () => boolean;
  reconnect: () => boolean;
  playerID: string | null;
  name: string | null;
  race: string | null;
  gender: string | null;
  players: Record<string, Player>;
  joinGame: (data: any) => Promise<void>;
  reset: () => void;
  sendMessage: (
    type: "action" | "world" | "system",
    msg: string
  ) => Promise<void>;
  chatHistory: ChatMessage[];
  narratorIsThinking: boolean;
  turn: number;
  hasPlayerActed: boolean;
}

export const GameApiContext = createContext<GameApiContextType | undefined>(
  undefined
);

export function GameApiProvider({ children }: { children: ReactNode }) {
  const [playerID, setPlayerID] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [race, setRace] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [turn, setTurn] = useState(0);

  // TODO: Probable could merge worldHistory and actionHistory into one state (now that we have timestamps as well)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); // keeps an array of chat messages (check Message type)
  const [systemHistory, setSystemHistory] = useState<string[]>([]); // TODO: will be used later to implement system messages, such as "player joined game".
  const [narratorIsThinking, setNarratorIsThinking] = useState(false);

  // Same info also in Player object from backend (status property)
  // We model it here in this state as well for instant UI changes
  const [hasPlayerActed, setHasPlayerActed] = useState(false);


  // TODO: Could set up websocket here to avoid polling?
  useEffect(() => {
    fetchPlayers();
    fetchTurn();
    const interval = setInterval(() => {
      fetchPlayers();
      fetchTurn();
    }, 1000); // Poll every 1 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTurn = async () => {
    try {
      const res = await fetch("http://localhost:8000/turn");
      if (res.ok) {
        const data = await res.json();
        setTurn(data.turn);
      } else {
        console.error("Failed to fetch turn");
      }
    } catch (error) {
      console.error("Error fetching turn:", error);
    }
  };


  const fetchPlayers = async () => {
    try {
      const res = await fetch("http://localhost:8000/players");
      if (res.ok) {
        const data = await res.json();
        const players = Object.values(data.players) as Player[];
        setPlayers(data.players);
        if (players.every((p) => p.status === "narrator_thinking")) {
          setNarratorIsThinking(true);
        } else {
          setNarratorIsThinking(false);
        }
      } else {
        console.error("Failed to fetch players");
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
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
    setChatHistory([]);
    setSystemHistory([]);
    setPlayers({});
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
    const storedChatHistory = JSON.parse(
      localStorage.getItem("chatHistory") || "[]"
    );
    setPlayerID(storedPlayerID); // also triggers the useEffect, which establishes a new websocket connection.
    setName(storedName);
    setRace(storedRace);
    setGender(storedGender);
    setChatHistory(storedChatHistory)
    fetchPlayers();
    return true;
  };


  // WEBSOCKET LOGIC (backend --> frontend)
  useEffect(() => {
    if (!playerID) {
      setWs(null);
      return;
    }
    const socket = new WebSocket(`ws://localhost:8000/ws?player_id=${playerID}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const sender = data.sender;

      console.log("Received message from backend:", data);

      // When own message reflected back --> action taken 
      //  --> cannot send another action this turn
      if (sender === playerID) {
        setHasPlayerActed(true);
        return;
      }

      // TODO: Handle system messages
      if (data.type === "system") return;

      // Base chat message, to avoid filling out the same stuff multiple times
      const baseMessage: Partial<ChatMessage> = {
        message: data.message,
        name: null,
        race: null,
        gender: null,
        createdAt: Date.now(),
      };

      // Narration message
      if (sender === "narrator" && data.type === "narration") {
        // Narration --> new turn --> Unlock all player's chat boxes / actions again
        setHasPlayerActed(false);
        addChatMessage({
          ...baseMessage,
          sender: "narrator",
          type: "narration",
        } as ChatMessage);
        return;
      }

      // World message (answer to question)
      if (sender === "narrator" && data.type === "world") {
        addChatMessage({
          ...baseMessage,
          sender: "narrator",
          type: "world",
        } as ChatMessage);
        return;
      }

      // Action message from a player
      let player = players[sender];
      if (!player) {
        console.warn(
          "Sender not found in players list:",
          sender,
          "- refreshing players list."
        );
        fetchPlayers();
        player = players[sender];
      }
      addChatMessage({
        ...baseMessage,
        sender,
        name: player?.name ?? sender,
        race: player?.race ?? null,
        gender: player?.gender ?? null,
      } as ChatMessage);
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);
    setWs(socket);
    console.log("Connected successfully to websocket.");
    return () => socket.close();
  }, [playerID]);


  // CHAT LOGIC (frontend --> backend)
  const sendMessage = async (type: "action" | "world" | "system", msg: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {

      // We send the message to the backend in appropriate format
      const payload = JSON.stringify({
        type, // TODO: Eventually, we can ignore sending type of message from frotnend since backend auto-determines.
        pid: playerID,
        message: msg,
      });
      await ws.send(payload);

      // We append message to correct history, to display in frontend
      const message: ChatMessage = { 
        sender: String(playerID), 
        message: msg,
        race: race,
        gender: gender,
        name: name,
        // TODO: need status here? 
      };
      addChatMessage(message);
    } else {
      console.warn("WebSocket not connected yet. Message not recieved");
    }
  };

 // Appending chat messaged to chatHistory state
  const addChatMessage = (msg: ChatMessage) => {
    const stampedMsg = msg.createdAt ? msg : { ...msg, createdAt: Date.now() };

    setChatHistory((prev) => {
      let updated = [...prev];
      
      // If this is a real narrator message (not loading), replace the loading placeholder
      if (stampedMsg.sender === "narrator" && stampedMsg.status !== "loading") {
        // Find and replace the loading message with the real one
        const loadingIndex = updated.findIndex((m) => m.sender === "narrator" && m.status === "loading");
        if (loadingIndex !== -1) {
          updated[loadingIndex] = stampedMsg;
          localStorage.setItem("chatHistory", JSON.stringify(updated));
          return updated;
        }
      }
      
      // Otherwise, just add the message
      updated.push(stampedMsg);
      localStorage.setItem("chatHistory", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (narratorIsThinking) {
      const loadingMessage: ChatMessage = {
        sender: "narrator",
        message: "",
        race: null, 
        gender: null,
        name: null,
        createdAt: Date.now(),
        status: "loading",
      };
      setChatHistory((prev) => [...prev, loadingMessage]);
    }
  }, [narratorIsThinking]);

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
        sendMessage,
        chatHistory,
        narratorIsThinking,
        turn,
        hasPlayerActed, 
      }}
    >
      {children}
    </GameApiContext.Provider>
  );
}
