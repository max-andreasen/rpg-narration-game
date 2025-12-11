"use client";

import Image from "next/image";
import { PlayersView } from "./PlayersView";
import GameChat from "./GameChat";
import { Message, Player } from "../types";

interface Props {
  worldHistory: Message[];
  actionHistory: Message[];
  submitWorld: (msg: string) => void;
  submitAction: (msg: string) => void;
  resetGame: () => void;
  players: Record<string, Player>;
  worldChat: string;
  actionChat: string;
  setWorldChat: (msg: string) => void;
  setActionChat: (msg: string) => void;
  onSubmitWorld: (e: any) => void;
  onSubmitAction: (e: any) => void;
}

export default function GameView({
  worldHistory,
  actionHistory,
  submitWorld,
  submitAction,
  resetGame,
  players,
  worldChat,
  actionChat,
  setWorldChat,
  setActionChat,
  onSubmitWorld,
  onSubmitAction,
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
            worldHistory={worldHistory}
            actionHistory={actionHistory}
            submitWorld={submitWorld}
            submitAction={submitAction}
            players={players}
            worldChat={worldChat}
            actionChat={actionChat}
            setWorldChat={setWorldChat}
            setActionChat={setActionChat}
            onSubmitWorld={onSubmitWorld}
            onSubmitAction={onSubmitAction}
        />
      </div>
    </div>
  );
}