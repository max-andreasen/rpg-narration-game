"use client";

import Image from "next/image";
import NarratorLoading from "./NarratorLoading";

interface ChatMessageProps {
  message: string;
  sender: string;
  name?: string;
  race?: string | null;
  gender?: string | null;
  status?: "loading";
}

export default function ChatMessage({
  message,
  sender,
  name,
  race,
  gender,
  status,
}: ChatMessageProps) {
  const isNarrator = sender === "narrator";
  const isPlayer = !isNarrator;

  const getPortraitSrc = () => {
    if (!isPlayer) return "/races/narrator.png";
    if (!race || !gender) return "/races/narrator.png";

    const racePrefix = race.charAt(0).toLowerCase();
    const genderPrefix = gender.charAt(0).toLowerCase();
    return `/races/${racePrefix}_${genderPrefix}.png`;
  };

  const portraitSrc = getPortraitSrc();
  const altText = isPlayer ? name ?? `${race ?? "Unknown"} ${gender ?? ""}` : "Narrator";

  if (status === "loading") {
    return <NarratorLoading />;
  }

  return (
    <div className={`flex items-start gap-3 ${isPlayer ? "justify-end" : ""}`}>
      {!isPlayer && (
        <Image
          src={portraitSrc}
          alt={altText}
          width={40}
          height={40}
          className="rounded-full border-2 border-[#b6925b]"
        />
      )}
      <div
        className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm shadow-md ${
          isPlayer
            ? "bg-[#d4cba9] text-[#3a2714] border-2 border-[#b6925b]"
            : "bg-[#f3e0b5] text-[#3a2714] border-2 border-[#b6925b]"
        }`}
      >
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
      {isPlayer && (
        <Image
          src={portraitSrc}
          alt={altText}
          width={40}
          height={40}
          className="rounded-full border-2 border-[#b6925b]"
        />
      )}
    </div>
  );
}

