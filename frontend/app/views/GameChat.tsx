"use client";

import { useEffect, useRef, useContext } from "react";
import { Message, Player } from "../types";
import ChatMessage from "./ChatMessage";
import useTypewriter from "../hooks/useTypewriter";
import { GameApiContext } from "../GameAPIContext";
import WaitingForPlayers from "./WaitingForPlayers";

interface Props {
  worldHistory: Message[];
  actionHistory: (Message & { status?: "loading" })[];
  submitWorld: (msg: string) => void;
  submitAction: (msg: string) => void;
  worldChat: string;
  actionChat: string;
  players: Record<string, Player>;
  setWorldChat: (msg: string) => void;
  setActionChat: (msg: string) => void;
  onSubmitWorld: (e: any) => void;
  onSubmitAction: (e: any) => void;
}

export default function GameChat({
  worldHistory,
  actionHistory,
  worldChat,
  actionChat,
  players,
  setWorldChat,
  setActionChat,
  onSubmitAction,
}: Props) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { playerID, turn } = useContext(GameApiContext)!;

  const currentPlayer = players && playerID ? (players as any)[playerID] : null;
  const hasPlayerActed = currentPlayer?.status === "action_submitted";

  const lastActionMessage = actionHistory[actionHistory.length - 1];

  const displayedNarratorMessage = useTypewriter(
    lastActionMessage?.sender === "narrator"
      ? lastActionMessage?.message ?? ""
      : "",
    10
  );

  // Waiting logic preserved from working branch
  const isWaitingForNarrator =
    hasPlayerActed &&
    (
      !lastActionMessage ||
      lastActionMessage.sender !== "narrator" ||
      lastActionMessage.status === "loading"
    );

  // Merge + order messages by timestamp
  const chatLog = [
    ...worldHistory.map((m) => ({ ...m })),
    ...actionHistory.map((m) => ({ ...m })),
  ].sort((a, b) => {
    const at = a.createdAt ?? 0;
    const bt = b.createdAt ?? 0;
    return at - bt;
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatLog, displayedNarratorMessage]);

  return (
    <div className="w-full flex flex-col md:flex-row justify-center gap-x-8 mt-20 md:mt-0 md:ml-64">
      {/* Turn Counter */}
      <div className="absolute top-1 right-1 bg-[#b6925b] text-white text-sm font-bold p-1 rounded-md border-2 border-[#e3c779]">
        Turn: {turn}
      </div>

      {/* CHAT WINDOW */}
      <div className="max-w-6xl w-full mb-6 flex flex-col mt-10">
        <div
          ref={chatContainerRef}
          className="flex-grow h-96 md:h-128 overflow-y-auto mb-3 p-2 rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/80 text-[#3a2714] space-y-2"
        >
          {chatLog.map((msg, idx) => {
            const isLastNarratorMessage =
              msg.sender === "narrator" &&
              msg === lastActionMessage;

            return (
              <div
                key={idx}
                className={
                  msg.sender === "narrator"
                    ? "flex justify-start"
                    : "flex justify-end"
                }
              >
                <ChatMessage
                  message={
                    isLastNarratorMessage
                      ? displayedNarratorMessage
                      : msg.message
                  }
                  sender={msg.sender}
                  name={
                    msg.sender === "narrator"
                      ? "Narrator"
                      : players[msg.sender]?.name
                  }
                  race={players[msg.sender]?.race ?? null}
                  gender={players[msg.sender]?.gender ?? null}
                  status={msg.status}
                />
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <form onSubmit={onSubmitAction} className="flex gap-2">
          {isWaitingForNarrator ? (
            <div className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]">
              <WaitingForPlayers />
            </div>
          ) : (
            <input
              className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]"
              placeholder="State your action..."
              value={actionChat}
              onChange={(e) => setActionChat(e.target.value)}
              disabled={hasPlayerActed}
            />
          )}

          <button
            type="submit"
            className="rounded-md border-2 border-[#e3c779] bg-[#8c5d25] px-4 py-2 text-[#f9edd3] font-semibold shadow-[0_3px_0_#5a3b1a] active:translate-y-0.5"
            disabled={hasPlayerActed}
          >
            Act
          </button>
        </form>
      </div>
    </div>
  );
}
