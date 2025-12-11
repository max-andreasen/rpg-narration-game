"use client";

export default function WaitingForPlayers() {
  return (
    <div className="flex items-center justify-center opacity-50">
      <p className="font-bold">Waiting for other players</p>
      <div className="animate-pulse flex space-x-1 ml-1 mt-1"> 
        <div className="rounded-full bg-slate-700 h-1 w-1"></div>
        <div className="rounded-full bg-slate-700 h-1 w-1"></div>
        <div className="rounded-full bg-slate-700 h-1 w-1"></div>
      </div>
    </div>
  );
}
