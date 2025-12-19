"use client";

export default function TypingDots() {
  return (
    <div className="flex space-x-1 opacity-50">
      <div className="h-2 w-2 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 bg-slate-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 bg-slate-700 rounded-full animate-bounce" />
    </div>
  );
}
