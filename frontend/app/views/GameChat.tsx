"use client";
import { useEffect, useRef } from "react";
import { Message, Player } from "../types";
import ChatMessage from "./ChatMessage";

interface Props {
  worldHistory: Message[]; // narrator/world messages
  actionHistory: Message[]; // player/action messages
  submitWorld: (msg: string) => void;
  submitAction: (msg: string) => void;
  players: Record<string, Player>;
  worldChat: string;
  actionChat: string;
  setWorldChat: (msg: string) => void;
  setActionChat: (msg: string) => void;
  onSubmitWorld: (e: any) => void;
  onSubmitAction: (e: any) => void;
}

export default function GameChat({
  worldHistory,
  actionHistory,
  players,
  worldChat,
  actionChat,
  setWorldChat,
  setActionChat,
  onSubmitAction,
}: Props) {
  // No timestamps available — preserve each stream's order and render
  // worldHistory (narrator) messages as left, actionHistory (players) messages as right.
    
  // Combine and order histories by createdAt to keep narration after the triggering action.
  const chatLog = [
    ...worldHistory.map((m) => ({ ...m, side: "left" as const })),
    ...actionHistory.map((m) => ({ ...m, side: "right" as const })),
  ].sort((a, b) => {
    const at = a.createdAt ?? 0;
    const bt = b.createdAt ?? 0;
    return at - bt;
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom whenever chat arrays change (component is re-rendered when parent updates).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // small timeout to wait for DOM update
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [worldHistory.length, actionHistory.length]);

  return (
    <div className="w-full flex flex-col md:flex-row justify-center gap-x-8 mt-20 md:mt-0 md:ml-64">
      <div className="max-w-6xl w-full mb-6 flex flex-col mt-10">
        <div
          ref={scrollRef}
          className="flex-grow h-96 md:h-128 overflow-y-auto mb-3 p-2 rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/80 text-[#3a2714] space-y-2"
        >
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={msg.side === "left" ? "flex justify-start" : "flex justify-end"}
            >
              <ChatMessage
                message={msg.message}
                sender={msg.sender}
                name={
                  msg.name ??
                  (msg.sender === "narrator" ? "Narrator" : players[msg.sender]?.name)
                }
                race={msg.race ?? players[msg.sender]?.race ?? null}
                gender={msg.gender ?? players[msg.sender]?.gender ?? null}
              />
            </div>
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
  );
}
