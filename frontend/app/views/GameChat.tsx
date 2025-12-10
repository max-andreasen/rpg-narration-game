"use client";
import ChatMessage from "./ChatMessage";

type Message = {
    sender: "player" | "narrator";
    message: string;
  };

interface Props {
    worldHistory: Message[];
    actionHistory: Message[];
    submitWorld: (msg: string) => void;
    submitAction: (msg: string) => void;
    race: string | null;
    gender: string | null;
    worldChat: string;
    actionChat: string;
    setWorldChat: (msg: string) => void;
    setActionChat: (msg: string) => void;
    onSubmitWorld: (e: any) => void;
    onSubmitAction: (e: any) => void;
}

export default function GameChat({ worldHistory, actionHistory, submitWorld, submitAction, race, gender, worldChat, actionChat, setWorldChat, setActionChat, onSubmitWorld, onSubmitAction }: Props) {
    return (
        <div className="w-full flex justify-center gap-x-8 mt-20">

          {/* ACTION WINDOW */}
          <div className="max-w-6xl w-full mb-6">
            <h2 className="text-xl font-semibold text-[#f8ecd0] mb-1">
              Action Window
            </h2>
            <p className="text-xs text-[#c8b69a] italic mb-2">
              Only actions, no questions
            </p>

            <div className="h-200 overflow-y-auto mb-3 p-2 rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/80 text-[#3a2714] space-y-2">
              {actionHistory.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  message={msg.message}
                  sender={msg.sender}
                  race={race}
                  gender={gender}
                />
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
                className="rounded-md border-2 border-[#e3c779] bg-[#8c5d25] px-4 py-2 text-[#f9edd3] font-semibold shadow-[0_3px_0_#5a3b1a] active:translate-y-0.5">
                Act
              </button>
            </form>
          </div>
        </div>
    )
}