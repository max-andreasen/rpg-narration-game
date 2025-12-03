"use client";

import Image from "next/image";
import { useState } from "react";
import { Race, Gender } from "../types";

interface HomeProps {
  genders: Gender[];
  races: Race[];
  onJoinGame: (data: any) => void;
}

export default function HomeView({ genders, races, onJoinGame }: HomeProps) {
  const [race, setRace] = useState<"human" | "orc" | "elf">("human");
  const [gender, setGender] = useState<"m" | "f">("m");

  const raceMeta = races.find((r) => r.id === race);
  const portraitSrc = raceMeta
    ? `/races/${raceMeta.prefix}_${gender}.png`
    : undefined;
  const portraitAlt =
    raceMeta && `${raceMeta.label} ${gender === "m" ? "male" : "female"}`;

  const handleSubmit = (e: any) => {
    e.preventDefault(); // stops page reload
    const formData = new FormData(e.currentTarget);
    const data = {
      race: formData.get("race"),
      gender: formData.get("gender"),
      startingItem: formData.get("startingItem"),
      description: formData.get("description"),
    };
    onJoinGame(data);
  };

  return (
    <div className="relative min-h-screen">
      {/* Blurred background */}
      <Image
        src="/map_backround.jpg"
        alt="Map background"
        fill
        className="object-cover blur-sm -z-10"
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center bg-[#1b1512]/70 px-4">
        {/* Main container */}
        <div className="w-full max-w-xl rounded-lg border-4 border-[#5a3b1a] bg-gradient-to-b from-[#f8ecd0] to-[#e1c89b] shadow-[0_0_40px_rgba(0,0,0,0.6)] p-6 sm:p-8">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-semibold text-[#3a2714] drop-shadow-sm">
              Legends of the Language Model
            </h1>
            <p className="mt-1 text-sm text-[#5b4024] italic">
              Forge your hero and enter the tale.
            </p>
          </div>

          {/* Portrait preview */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-md border-2 border-[#5a3b1a] bg-[#f3e0b5] flex items-center justify-center">
              <Image
                src={portraitSrc ?? ""}
                alt={portraitAlt ?? ""}
                width={800}
                height={80}
                className="pixel-art"
              />
            </div>
          </div>

          {/* FORM */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Race */}
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#5b4024] uppercase mb-2">
                Choose your race
              </div>
              <div className="grid grid-cols-3 gap-2">
                {races.map((r) => (
                  <label
                    key={r.id}
                    className="flex flex-col items-center rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/90 px-2 py-2 text-xs sm:text-sm text-[#3a2714] cursor-pointer hover:border-[#e3c779] hover:bg-[#f7e8c6]"
                  >
                    <input
                      type="radio"
                      name="race"
                      value={r.id}
                      checked={race === r.id}
                      onChange={() => setRace(r.id)}
                      className="mb-1 accent-[#8c5d25]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#5b4024] uppercase mb-2">
                Gender
              </div>
              <div className="grid grid-cols-2 gap-2">
                {genders.map((g) => (
                  <label
                    key={g.id}
                    className="flex flex-col items-center rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/90 px-2 py-2 text-xs sm:text-sm text-[#3a2714] cursor-pointer hover:border-[#e3c779] hover:bg-[#f7e8c6]"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g.id}
                      checked={gender === g.id}
                      onChange={() => setGender(g.id)}
                      className="mb-1 accent-[#8c5d25]"
                    />
                    <span>{g.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Starting item */}
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#5b4024] uppercase mb-2">
                Starting item
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "boots", label: "Boots of\nWater Walking" },
                  { id: "lantern", label: "Lantern" },
                  { id: "dagger", label: "Dagger" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex flex-col items-center rounded-md border-2 border-[#b6925b] bg-[#f3e0b5]/90 px-2 py-2 text-xs sm:text-sm text-[#3a2714] cursor-pointer hover:border-[#e3c779] hover:bg-[#f7e8c6] text-center whitespace-pre-line"
                  >
                    <input
                      type="radio"
                      name="startingItem"
                      value={item.id}
                      defaultChecked={item.id === "boots"}
                      className="mb-1 accent-[#8c5d25]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#5b4024] uppercase mb-2">
                Character description
              </div>
              <textarea
                name="description"
                rows={4}
                className="w-full rounded-md border-2 border-[#b6925b] bg-[#f9edd3] px-3 py-2 text-sm text-[#3a2714] placeholder-[#a18457] focus:outline-none focus:border-[#e3c779]"
                placeholder="A wandering elf scholar, hungry for knowledge and glory..."
              />
            </div>

            {/* Join button */}
            <button
              type="submit"
              className="mt-2 w-full rounded-md border-2 border-[#e3c779] bg-[#8c5d25] px-4 py-3 text-sm font-semibold tracking-wide text-[#f9edd3] shadow-[0_4px_0_#5a3b1a] active:translate-y-0.5 active:shadow-[0_2px_0_#5a3b1a]"
            >
              Join game
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
