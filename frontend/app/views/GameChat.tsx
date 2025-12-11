"use client";
import { useRef, useEffect, useContext } from "react";
import ChatMessage from "./ChatMessage";
import useTypewriter from "../hooks/useTypewriter";
import { Player } from "../types";
import { GameApiContext } from "../GameAPIContext";
import WaitingForPlayers from "./WaitingForPlayers";

type Message = {
    sender: "player" | "narrator";
    message: string;
    status?: "loading";
  };

interface Props {
    worldHistory: Message[];
    actionHistory: (Message & { status?: "loading" })[];
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
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const lastMessage = actionHistory[actionHistory.length - 1];
    const displayedMessage = useTypewriter(lastMessage?.sender === "narrator" ? lastMessage?.message ?? "" : "", 10);
    const { players, playerID, turn } = useContext(GameApiContext)!;

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [actionHistory, displayedMessage]);

    const currentPlayer = players && playerID ? (players as any)[playerID] : null;
    const hasPlayerActed = currentPlayer?.status === "action_submitted";

    return (
        <div className="w-full flex flex-col md:flex-row justify-center gap-x-8 mt-20 md:mt-0 md:ml-64">

          {/* Turn Counter */}
          <div className="absolute top-1 right-1 bg-[#b6925b] text-white text-sm font-bold p-1 rounded-md border-2 border-[#e3c779]">
            Turn: {turn}
          </div>

          {/* ACTION WINDOW */}
          <div className="max-w-6xl w-full mb-6 flex flex-col mt-10">
            <div ref={chatContainerRef} className="flex-grow h-96 md:h-128 overflow-y-auto mb-3 p-2 rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/80 text-[#3a2714] space-y-2">
              {actionHistory.map((msg, idx) => {
                const isLastMessage = idx === actionHistory.length - 1;
                return (
                  <ChatMessage
                    key={idx}
                    message={isLastMessage && msg.sender === "narrator" ? displayedMessage : msg.message}
                    sender={msg.sender}
                    race={race}
                    gender={gender}
                    status={msg.status}
                  />
                );
              })}
            </div>

            <form onSubmit={onSubmitAction} className="flex gap-2">
              {hasPlayerActed ? (
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
    )
}