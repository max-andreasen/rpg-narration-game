"use client";

import { useContext } from "react";
import { GameApiContext } from "../GameAPIContext";
import Image from "next/image";

export function PlayersView() {
  const { players, playerID } = useContext(GameApiContext)!;

  const getSpritePath = (race: string, gender: string) => {
    return `/races/${race.charAt(0)}_${gender.charAt(0)}.png`;
  };
  const mapped_players = Object.entries(players).map(([pid, p]) => ({ pid, ...p }));
  const me = mapped_players.find((p) => p.pid === playerID);
  const otherPlayers = mapped_players.filter((p) => p.pid !== playerID);

  return (
    <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-2">Players</h3>
      <ul>
        {me && (
          <li key={me.pid} className="flex items-center mb-4">
            <Image
              src={getSpritePath(me.race, me.gender)}
              alt={`${me.race} ${me.gender}`}
              width={40}
              height={40}
              className="mr-3 w-[40px] h-[40px]"
              loading="eager"
            />
            <div className="flex flex-col">
              <span className="font-bold">{me.name} (You)</span>
              <span className="text-xs text-green-400">HP: {me.hp ?? 100}</span>
              <span className="text-xs text-gray-300">
                 {me.items && me.items.length > 0 ? me.items.join(", ") : "No items"}
              </span>
            </div>
          </li>
        )}
        {otherPlayers.map((player) => (
          <li key={player.pid} className="flex items-center mb-4">
            <Image
              src={getSpritePath(player.race, player.gender)}
              alt={`${player.race} ${player.gender}`}
              width={40}
              height={40}
              className="mr-3 w-[40px] h-[40px]"
              loading="eager"
            />
            <div className="flex flex-col">
              <span className="font-bold">{player.name}</span>
              <span className="text-xs text-green-400">HP: {player.hp ?? 100}</span>
              <span className="text-xs text-gray-300">
                 {player.items && player.items.length > 0 ? player.items.join(", ") : "No items"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
