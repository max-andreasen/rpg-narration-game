"use client";

import Image from "next/image";
import { PlayersView } from "./PlayersView";
import GameChat from "./GameChat";
import { ChatMessage, Player } from "../types";
import { useState, useEffect } from "react";

interface Props {
  chatHistory: ChatMessage[];
  systemMessage: string;
  resetGame: () => void;
  players: Record<string, Player>;
  chatState: string;
  setChatState: (msg: string) => void;
  onSubmitPlayerMessage: (e: any) => void;
  hasPlayerActed: boolean;
}

export default function GameView({
  chatHistory,
  systemMessage,
  resetGame,
  players,
  chatState,
  setChatState,
  onSubmitPlayerMessage,
  hasPlayerActed,
}: Props) {
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Show popup when systemMessage changes
  useEffect(() => {
    if (systemMessage) {
      setPopupMessage(systemMessage);
      setVisible(true);

      const hideTimeout = setTimeout(() => setVisible(false), 3500); // fade out after 3.5s
      const clearPopup = setTimeout(() => setPopupMessage(null), 4000); // remove from DOM after 4s

      return () => {
        clearTimeout(hideTimeout);
        clearTimeout(clearPopup);
      };
    }
  }, [systemMessage]);

  const onResetGame = () => {
    resetGame();
  };

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row">
      {/* RESET BUTTON */}
      <button
        onClick={onResetGame}
        className="absolute bottom-4 left-4 z-20 rounded-md border-2 border-[#e3c779] bg-[#950606] px-4 py-2 text-[#f9edd3] font-semibold shadow-[0_3px_0_#5a3b1a] active:translate-y-0.5"
      >
        Reset Game
      </button>

      <PlayersView />

      {/* MAP BACKGROUND */}
      <Image  
        src="/map_backround.jpg"
        alt="Map background"
        fill
        className="object-cover -z-10"
      />

      {/* SYSTEM MESSAGE POPUP */}
      {popupMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-yellow-400 text-[#3a2714] border-2 border-[#b6925b] rounded-md px-4 py-2 shadow-lg transition-opacity duration-500 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {popupMessage}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="w-full flex flex-col md:flex-row justify-center gap-x-8 px-4 md:px-0">
        <GameChat
          chatHistory={chatHistory}
          players={players}
          chatState={chatState}
          setChatState={setChatState}
          onSubmitPlayerMessage={onSubmitPlayerMessage}
          hasPlayerActed={hasPlayerActed}
        />
      </div>
    </div>
  );
}
