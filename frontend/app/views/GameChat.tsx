"use client";

import { useEffect, useRef, useContext } from "react";
import { ChatMessage, Player } from "../types";
import ChatMessageComponent from "../components/ChatMessageComponent";
import useTypewriter from "../hooks/useTypewriter";
import { GameApiContext } from "../GameAPIContext";
import WaitingForPlayers from "../components/WaitingForPlayers";
import TypingDots from "../components/TypingDots";

interface Props {
  chatHistory: (ChatMessage & { status?: "loading" })[];
  chatState: string;
  setChatState: (msg: string) => void;
  players: Record<string, Player>;
  onSubmitPlayerMessage: (e: any) => void;
  hasPlayerActed: boolean;
}

export default function GameChat({
  chatHistory,
  chatState,
  players,
  setChatState,
  onSubmitPlayerMessage,
  hasPlayerActed,
}: Props) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { turn } = useContext(GameApiContext)!;

  const chatLog = [...chatHistory].sort(
    (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
  );

  const lastNarratorMessage = [...chatLog]
    .reverse()
    .find((m) => m.sender === "narrator");

  const isWaitingForNarrator =
    lastNarratorMessage?.status === "loading";

  const isWaitingForOtherPlayers =
    hasPlayerActed && !isWaitingForNarrator;

  const displayedNarratorMessage = useTypewriter(
    lastNarratorMessage?.message ?? "",
    10
  );

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 300;

    // Auto-scroll if user is near the bottom
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [displayedNarratorMessage, chatLog.length]);


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
                  type={msg.type}
                />
              </div>
            );
          })}

          {isWaitingForOtherPlayers && (
            <div className="flex justify-end pr-14 mt-1">
              <TypingDots />
            </div>
          )}
        </div>

        {/* INPUT / WAIT STATE */}
        <form onSubmit={onSubmitPlayerMessage} className="flex gap-2">
          {isWaitingForNarrator ? (
            <div className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]">
              <WaitingForPlayers text="Waiting for narrator" />
            </div>
          ) : hasPlayerActed ? (
            <div className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]">
              <WaitingForPlayers text="Waiting for other players" />
            </div>
          ) : (
            <input
              className="flex-1 rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714]"
              placeholder="State your action..."
              value={chatState}
              onChange={(e) => setChatState(e.target.value)}
            />
          )}

          <button
            type="submit"
            disabled={isWaitingForNarrator || hasPlayerActed}
            className={`rounded-md border-2 px-4 py-2 font-semibold ${
              isWaitingForNarrator || hasPlayerActed
                ? "border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed shadow-none"
                : "border-[#e3c779] bg-[#8c5d25] text-[#f9edd3] shadow-[0_3px_0_#5a3b1a] active:translate-y-0.5"
            }`}
          >
            Act
          </button>
        </form>
      </div>
    </div>
  );
}
