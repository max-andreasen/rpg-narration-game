"use client";

import Image from "next/image";
import { PlayersView } from "./PlayersView";
import GameChat from "./GameChat";

type Message = {
  sender: "player" | "narrator";
  message: string;
};

interface Props {
  worldHistory: Message[];
  actionHistory: Message[];
  submitWorld: (msg: string) => void;
  submitAction: (msg: string) => void;
  resetGame: () => void;
  race: string | null;
  gender: string | null;
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
  race,
  gender,
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
    <div className="relative min-h-screen flex">
      {/* RESET BUTTON */}
      <button
        onClick={onResetGame}
        className="absolute top-4 left-4 z-20 rounded-md border-2 border-[#e3c779] bg-[#950606] px-4 py-2 text-[#f9edd3] font-semibold shadow-[0_3px_0_#5a3b1a] active:translate-y-0.5"
      >
        Reset Game
      </button>

      <PlayersView />

      {/* TITLE - Added: Centered top with medieval styling to match theme */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[#f9edd3] tracking-widest uppercase drop-shadow-[0_3px_3px_rgba(0,0,0,0.8)] border-b-4 border-[#950606] pb-1 text-center">
          Legends of The Language Model
        </h1>
      </div>

      {/* MAP BACKGROUND */}
      <Image  
        src="/map_backround.jpg"
        alt="Map background"
        fill
        className="object-cover -z-10"
      />

      {/* MAIN CONTENT AREA */}
      <div className="w-full flex justify-center gap-x-8">
        <GameChat
            worldHistory={worldHistory}
            actionHistory={actionHistory}
            submitWorld={submitWorld}
            submitAction={submitAction}
            race={race}
            gender={gender}
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