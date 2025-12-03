"use client";

import HomeView from "@/app/views/home";
import { Race, Gender } from "../types";
import { GameApiContext } from "@/app/GameAPIContext";
import { useContext } from "react";
import { useRouter } from "next/navigation";

export default function HomeController() {
  const api = useContext(GameApiContext);
  if (!api) throw new Error("GameApiContext not provided");

  const router = useRouter();

  // TODO; get options from backend instead of hard-code into frontend
  const RACES: Race[] = [
    { id: "human", label: "Human", prefix: "h" },
    { id: "orc", label: "Orc", prefix: "o" },
    { id: "elf", label: "Elf", prefix: "e" },
  ];
  const GENDERS: Gender[] = [
    { id: "m", label: "Male" },
    { id: "f", label: "Female" },
  ];

  const getPortrait = (race: string, gender: string) => {
    // TODO: Refactor get images to the controller.
    return;
  };

  const onJoinGame = (data: any) => {
    api.joinGame(data); // player id is parsed into the GameAPIContext.
    router.push("/game"); // changes view to the game view
  }

  return <HomeView genders={GENDERS} races={RACES} onJoinGame={onJoinGame} />;
}
