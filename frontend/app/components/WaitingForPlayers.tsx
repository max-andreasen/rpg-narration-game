export default function WaitingForPlayers({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center opacity-50">
      <p className="font-bold">{text}</p>
      <div className="animate-pulse flex space-x-1 ml-1 mt-1">
        <div className="rounded-full bg-slate-700 h-1 w-1" />
        <div className="rounded-full bg-slate-700 h-1 w-1" />
        <div className="rounded-full bg-slate-700 h-1 w-1" />
      </div>
    </div>
  );
}
