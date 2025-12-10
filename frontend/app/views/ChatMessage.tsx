"use client";

import Image from "next/image";

interface ChatMessageProps {
  message: string;
  sender: "player" | "narrator";
  race?: string | null;
  gender?: string | null;
}

const RACES_PREFIX_MAP: { [key: string]: string } = {
  human: "h",
  orc: "o",
  elf: "e",
};

export default function ChatMessage({
  message,
  sender,
  race,
  gender,
}: ChatMessageProps) {
  const isPlayer = sender === "player";

  const getPortraitSrc = () => {
    if (isPlayer && race && gender) {
      const racePrefix = RACES_PREFIX_MAP[race];
      if (racePrefix) {
        return `/races/${racePrefix}_${gender}.png`;
      }
    }
    return "/races/narrator.png"; // A default narrator icon
  };

  const portraitSrc = getPortraitSrc();
  const altText = isPlayer ? `${race} ${gender}` : "Narrator";

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
