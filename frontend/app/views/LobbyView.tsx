"use client";
import Image from "next/image";
import { Player } from "../types";

interface Props {
  players: Record<string, Player>;
  systemMessage: string;
  onGameStart: () => void;
}

export default function LobbyView({
  players,
  systemMessage,
  onGameStart,
}: Props) {
  const playerList = Object.values(players);

  const getPortraitSrc = (player: Player) => {
    if (!player.race || !player.gender) {
      return "/races/narrator.png";
    }
    const racePrefix = player.race.charAt(0).toLowerCase();
    const genderPrefix = player.gender.charAt(0).toLowerCase();
    return `/races/${racePrefix}_${genderPrefix}.png`;
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center p-6">
      {/* Background Image - Blurred */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-sm"
        style={{ backgroundImage: 'url(/map_backround.jpg)' }}
      />
      
      {/* Content Container - Semi-transparent */}
      <div className="relative z-10 flex flex-col items-center gap-6 bg-[#f3e0b5]/90 backdrop-blur-sm border-2 border-[#b6925b] rounded-xl p-8 shadow-lg w-full max-w-2xl mt-8">
        <h1 className="text-2xl font-bold text-[#3a2714]">
          Players
        </h1>

        {/* PLAYER LIST */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 w-full">
          {playerList.length === 0 && (
            <div className="text-sm text-gray-500 text-center">
              No players connected
            </div>
          )}
          {playerList.map((player, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 bg-[#d4cba9] border-2 border-[#b6925b] rounded-lg px-6 py-3 shadow-sm"
            >
              <Image
                src={getPortraitSrc(player)}
                alt={player.name ?? "Player"}
                width={40}
                height={40}
                className="rounded-full border-2 border-[#b6925b]"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#3a2714]">
                  {player.name ?? "Unnamed player"}
                </span>
                <span className="text-xs text-[#5a4632]">
                  {player.race ?? "Unknown race"} · {player.gender ?? "Unknown gender"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* START GAME BUTTON */}
        <button
          onClick={onGameStart}
          disabled={playerList.length === 0}
          className="mt-4 px-6 py-3 rounded-lg text-sm font-semibold
                     bg-[#3a2714] text-[#f3e0b5]
                     border-2 border-[#b6925b]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-[#4a341c] transition"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}