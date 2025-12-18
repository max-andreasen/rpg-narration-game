"use client";

import Image from "next/image";
import { PlayersView } from "./PlayersView";
import GameChat from "./GameChat";
import { ChatMessage, Player } from "../types";

interface Props {
  chatHistory: ChatMessage[];
  resetGame: () => void;
  players: Record<string, Player>;
  chatState: string; // what is being typed
  setChatState: (msg: string) => void;
  onSubmitPlayerMessage: (e: any) => void;
  hasPlayerActed: boolean;
}

export default function GameView({
  chatHistory,
  resetGame,
  players,
  chatState,
  setChatState,
  onSubmitPlayerMessage,
  hasPlayerActed, // from GameContext state
}: Props) {

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