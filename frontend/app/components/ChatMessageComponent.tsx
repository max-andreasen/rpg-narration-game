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
  type?: "narration" | "world";
}

export default function ChatMessage({
  message,
  sender,
  name,
  race,
  gender,
  status,
  type,
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
  const altText = isPlayer
    ? name ?? `${race ?? "Unknown"} ${gender ?? ""}`
    : "Narrator";

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

      {/* MESSAGE BUBBLE */}
      {isPlayer || type === "world" ? (
        /* Player + World messages */
        <div
          className={`max-w-xs md:max-w-md rounded-lg px-4 py-3 text-sm shadow-md ${
            isPlayer
              ? "bg-[#d4cba9] text-[#3a2714] border-2 border-[#b6925b]"
              : "bg-[#f3e0b5] text-[#3a2714] border-2 border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.5)]"
          }`}
        >
          {type === "world" && (
            <div className="mb-1 text-[10px] text-gray-500 select-none">
              This message is only visible to you
            </div>
          )}

          {type === "world" && (
            <span className="font-semibold text-gray-600">Answer: </span>
          )}

          <p className="whitespace-pre-wrap">{message}</p>
        </div>
      ) : (
        /* NARRATION MESSAGE WITH GOLDEN GLOW */
        <div className="relative max-w-xs md:max-w-md">
          <div className="absolute inset-0 rounded-lg blur-xl bg-yellow-400 opacity-40" />

          <div
            className="relative rounded-lg px-4 py-2 text-sm
                       bg-[#f3e0b5] text-[#3a2714]
                       border-2 border-[#b6925b]
                       shadow-lg"
          >
            <p className="whitespace-pre-wrap">{message}</p>
          </div>
        </div>
      )}

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
