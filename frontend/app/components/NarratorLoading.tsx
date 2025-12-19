"use client";

import Image from "next/image";

export default function NarratorLoading() {
  return (
    <div className="flex items-center p-4">
      <Image
        src="/races/narrator.png"
        alt="Narrator"
        width={40}
        height={40}
        className="rounded-full"
      />
      <div className="ml-4 flex space-x-1 opacity-50"> 
        <div className="h-2 w-2 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-slate-700 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}