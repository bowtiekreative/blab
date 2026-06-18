import { useEffect, useRef } from 'react';

export interface Slot {
  index: number;
  userId: string | null;
  username?: string;
  claps?: number;
}

interface Props {
  slots: Slot[];
  myUserId: string;
  /** Media streams keyed by userId (own local stream + remote SFU streams). */
  streams: Record<string, MediaStream>;
  topClappedUserId: string | null;
  onJoin: (index: number) => void;
  onLeave: () => void;
  onClap: (userId: string) => void;
  onGift: (userId: string) => void;
}

/**
 * The signature 4-person carousel (2×2). Each occupied slot renders the
 * participant's media stream (local for yourself, SFU-forwarded for others).
 */
export default function Carousel({
  slots,
  myUserId,
  streams,
  topClappedUserId,
  onJoin,
  onLeave,
  onClap,
  onGift,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((slot) => (
        <SlotPanel
          key={slot.index}
          slot={slot}
          isMine={slot.userId === myUserId}
          isTopClapped={!!slot.userId && slot.userId === topClappedUserId}
          stream={slot.userId ? streams[slot.userId] ?? null : null}
          canInteract={!!slot.userId && slot.userId !== myUserId}
          onJoin={() => onJoin(slot.index)}
          onLeave={onLeave}
          onClap={() => slot.userId && onClap(slot.userId)}
          onGift={() => slot.userId && onGift(slot.userId)}
        />
      ))}
    </div>
  );
}

function SlotPanel({
  slot,
  isMine,
  isTopClapped,
  stream,
  canInteract,
  onJoin,
  onLeave,
  onClap,
  onGift,
}: {
  slot: Slot;
  isMine: boolean;
  isTopClapped: boolean;
  stream: MediaStream | null;
  canInteract: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onClap: () => void;
  onGift: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div
      className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-zinc-950 ${
        isTopClapped ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'border-zinc-800'
      }`}
    >
      {slot.userId ? (
        <>
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMine}
              className="h-full w-full object-cover"
            />
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
            canInteract && (
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  onClick={onClap}
                  className="rounded bg-amber-500/90 px-2 py-1 text-xs font-semibold"
                >
                  👏
                </button>
                <button
                  onClick={onGift}
                  className="rounded bg-pink-500/90 px-2 py-1 text-xs font-semibold"
                >
                  🎁
                </button>
              </div>
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
