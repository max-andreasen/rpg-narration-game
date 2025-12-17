"use client";

import { useEffect, useRef, useContext } from "react";
import { ChatMessage, Player } from "../types";
import ChatMessageComponent from "./ChatMessageComponent";
import useTypewriter from "../hooks/useTypewriter";
import { GameApiContext } from "../GameAPIContext";
import WaitingForPlayers from "./WaitingForPlayers";

interface Props {
  chatHistory: (ChatMessage & { status?: "loading" })[];
  chatState: string;
  setChatState: (msg: string) => void;
  players: Record<string, Player>;
  onSubmitPlayerMessage: (e: any) => void;
}

export default function GameChat({
  chatHistory,
  chatState,
  players,
  setChatState,
  onSubmitPlayerMessage,
}: Props) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { playerID, turn } = useContext(GameApiContext)!;

  const currentPlayer = playerID ? players[playerID] : null;
  const hasPlayerActed = currentPlayer?.status === "action_submitted";

  // Sort chat by timestamp
  const chatLog = [...chatHistory].sort(
    (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
  );

  // Find last narrator message for typewriter
  const lastNarratorMessage = [...chatLog]
    .reverse()
    .find((m) => m.sender === "narrator");

  // Apply typewriter effect only to completed narrator messages, not loading placeholders
  const displayedNarratorMessage = useTypewriter(
    lastNarratorMessage?.status !== "loading" && lastNarratorMessage?.message
      ? lastNarratorMessage.message
      : "",
    10
  );

  // Waiting for narrator if player acted and narrator hasn't finished
  const isWaitingForNarrator =
    hasPlayerActed &&
    lastNarratorMessage?.status === "loading";

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
            const isLastNarratorMessage = msg === lastNarratorMessage;

            return (
              <div
                key={idx}
                className={
                  msg.sender === "narrator"
                    ? "flex justify-start"
                    : "flex justify-end"
                }
              >
                <ChatMessageComponent
                  message={
                    isLastNarratorMessage && msg.status !== "loading"
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
        <form onSubmit={onSubmitPlayerMessage} className="flex gap-2">
          {isWaitingForNarrator ? (
            <div className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]">
              <WaitingForPlayers />
            </div>
          ) : (
            <input
              className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]"
              placeholder="State your action..."
              value={chatState}
              onChange={(e) => setChatState(e.target.value)}
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
