import { useEffect, useRef } from 'react';

export interface Slot {
  index: number;
  userId: string | null;
  username?: string;
  claps?: number;
}

interface Props {
  slots: Slot[];
  mySlot: number | null;
  myUserId: string;
  localStream: MediaStream | null;
  topClappedUserId: string | null;
  onJoin: (index: number) => void;
  onLeave: () => void;
  onClap: (userId: string) => void;
}

/**
 * The signature 4-person carousel (2×2). The local user's own camera renders
 * in their slot; remote participant video arrives via the SFU in Phase 3.
 */
export default function Carousel({
  slots,
  mySlot,
  myUserId,
  localStream,
  topClappedUserId,
  onJoin,
  onLeave,
  onClap,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((slot) => (
        <SlotPanel
          key={slot.index}
          slot={slot}
          isMine={slot.userId === myUserId}
          isTopClapped={!!slot.userId && slot.userId === topClappedUserId}
          localStream={mySlot === slot.index ? localStream : null}
          canClap={!!slot.userId && slot.userId !== myUserId}
          onJoin={() => onJoin(slot.index)}
          onLeave={onLeave}
          onClap={() => slot.userId && onClap(slot.userId)}
        />
      ))}
    </div>
  );
}

function SlotPanel({
  slot,
  isMine,
  isTopClapped,
  localStream,
  canClap,
  onJoin,
  onLeave,
  onClap,
}: {
  slot: Slot;
  isMine: boolean;
  isTopClapped: boolean;
  localStream: MediaStream | null;
  canClap: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onClap: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = localStream;
  }, [localStream]);

  return (
    <div
      className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-zinc-950 ${
        isTopClapped ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'border-zinc-800'
      }`}
    >
      {slot.userId ? (
        <>
          {localStream ? (
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-3xl font-bold text-zinc-600">
              {(slot.username || '?')[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs">
            {isTopClapped && '🔥 '}@{slot.username || slot.userId.slice(0, 6)} · 👏 {slot.claps ?? 0}
          </div>
          {isMine ? (
            <button
              onClick={onLeave}
              className="absolute right-2 top-2 rounded bg-red-600/80 px-2 py-1 text-xs font-semibold"
            >
              Leave
            </button>
          ) : (
            canClap && (
              <button
                onClick={onClap}
                className="absolute right-2 top-2 rounded bg-amber-500/90 px-2 py-1 text-xs font-semibold"
              >
                👏 Clap
              </button>
            )
          )}
        </>
      ) : (
        <button
          onClick={onJoin}
          className="flex h-full w-full items-center justify-center text-zinc-600 transition hover:bg-zinc-900 hover:text-indigo-400"
        >
          + Join slot {slot.index}
        </button>
      )}
    </div>
  );
}
