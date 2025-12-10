"use client";

import { useContext } from "react";
import { GameApiContext } from "../GameAPIContext";
import Image from "next/image";

export function PlayersView() {
  const { players, playerID } = useContext(GameApiContext)!;

  const getSpritePath = (race: string, gender: string) => {
    return `/races/${race.charAt(0)}_${gender}.png`;
  };

  const me = players.find((p) => p.id === playerID);
  const otherPlayers = players.filter((p) => p.id !== playerID);

  return (
    <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-2">Players</h3>
      <ul>
        {me && (
          <li key={me.id} className="flex items-center mb-2">
            <Image
              src={getSpritePath(me.race, me.gender)}
              alt={`${me.race} ${me.gender}`}
              width={40}
              height={40}
              className="mr-2"
            />
            <span>{me.name} (You)</span>
          </li>
        )}
        {otherPlayers.map((player) => (
          <li key={player.id} className="flex items-center mb-2">
            <Image
              src={getSpritePath(player.race, player.gender)}
              alt={`${player.race} ${player.gender}`}
              width={40}
              height={40}
              className="mr-2"
            />
            <span>{player.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
