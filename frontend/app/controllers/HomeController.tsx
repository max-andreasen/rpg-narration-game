"use client";

import HomeView from "@/app/views/home";
import { Race, Gender } from "../types";
import { GameApiContext } from "@/app/GameAPIContext";
import { useContext } from "react";

export default function HomeController() {
  const api = useContext(GameApiContext);
  if (!api) throw new Error("GameApiContext not provided");

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
    api.sendMessage("Test123");
  };

  return <HomeView genders={GENDERS} races={RACES} onJoinGame={onJoinGame} />;
}
