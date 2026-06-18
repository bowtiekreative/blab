import type { Gift } from '../api/client';

interface Props {
  catalog: Gift[];
  recipientName: string;
  balance: number;
  onSend: (giftType: string) => void;
  onClose: () => void;
}

/** Compact gift catalog overlay for sending a gift to a slot participant. */
export default function GiftPicker({ catalog, recipientName, balance, onSend, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Gift <span className="text-indigo-400">@{recipientName}</span>
          </h3>
          <span className="text-sm text-zinc-400">⏣ {balance}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {catalog.map((g) => {
            const affordable = balance >= g.cost;
            return (
              <button
                key={g.type}
                disabled={!affordable}
                onClick={() => onSend(g.type)}
                className={`flex flex-col items-center gap-1 rounded-xl border border-zinc-800 p-3 transition ${
                  affordable ? 'hover:border-indigo-500 hover:bg-zinc-800' : 'opacity-40'
                }`}
              >
                <span className="text-2xl">{g.icon}</span>
                <span className="text-xs text-zinc-400">⏣{g.cost}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
