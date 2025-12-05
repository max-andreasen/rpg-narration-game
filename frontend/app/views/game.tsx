"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation"; // import router

interface Props {
  worldHistory: string[];
  actionHistory: string[];
  submitWorld: (msg: string) => void;
  submitAction: (msg: string) => void;
  resetGame: () => void;
}

export default function GameView({
    worldHistory,
    actionHistory,
    submitWorld,
    submitAction,
    resetGame, 
}: any) {

  const router = useRouter(); // initialize router
  const [worldChat, setWorldChat] = useState("");
  const [actionChat, setActionChat] = useState("");

  const onSubmitWorld = (e: any) => {
    e.preventDefault();
    if (!worldChat.trim()) return;
    submitWorld(worldChat);
    setWorldChat("");
  };

  const onSubmitAction = (e: any) => {
    e.preventDefault();
    if (!actionChat.trim()) return;
    submitAction(actionChat);
    setActionChat("");
  };

  const onResetGame = () => {
    resetGame();
    router.push("/"); // route back to homepage
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

      {/* MAP BACKGROUND */}
      <Image
        src="/map_backround.jpg"
        alt="Map background"
        fill
        className="object-cover -z-10"
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative z-10 p-4 flex flex-col justify-end items-center">
        {/* ACTION WINDOW */}
        <div className="max-w-3xl w-full mb-6">
          <h2 className="text-xl font-semibold text-[#f8ecd0] mb-1">Action Window</h2>
          <p className="text-xs text-[#c8b69a] italic mb-2">Only actions, no questions</p>

          <div className="h-56 overflow-y-auto mb-3 p-2 rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/80 text-[#3a2714] space-y-2">
            {actionHistory.map((msg: string, idx: number) => (
              <div key={idx} className="whitespace-pre-wrap">{msg}</div>
            ))}
          </div>

          <form onSubmit={onSubmitAction} className="flex gap-2">
            <input
              className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]"
              placeholder="State your action..."
              value={actionChat}
              onChange={(e) => setActionChat(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-md border-2 border-[#e3c779] bg-[#8c5d25] px-4 py-2 text-[#f9edd3] font-semibold shadow-[0_3px_0_#5a3b1a] active:translate-y-0.5"
            >
              Act
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-80 bg-[#1b1512]/70 border-l-4 border-[#5a3b1a] p-4 flex flex-col relative z-10">
        <div className="text-center mb-3">
          <h2 className="text-xl font-semibold text-[#f8ecd0]">Question chat</h2>
          <p className="text-xs text-[#c8b69a] italic">Ask questions about the world</p>
        </div>

        <div className="flex-1 overflow-y-auto mb-3 p-2 rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/80 text-[#3a2714] space-y-2">
          {worldHistory.map((msg: string, idx: number) => (
            <div key={idx} className="whitespace-pre-wrap">{msg}</div>
          ))}
        </div>

        <form onSubmit={onSubmitWorld} className="flex gap-2">
          <input
            className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-2 py-1 text-sm text-[#3a2714]"
            placeholder="Ask the narrator..."
            value={worldChat}
            onChange={(e) => setWorldChat(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-md border-2 border-[#e3c779] bg-[#8c5d25] px-3 py-1 text-[#f9edd3] font-semibold shadow-[0_2px_0_#5a3b1a] active:translate-y-0.5"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
