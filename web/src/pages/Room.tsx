import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RoomSocket, type ServerEvent } from '../api/ws';
import { useAuth } from '../store/auth';
import Carousel, { type Slot } from '../components/Carousel';
import Chat, { type ChatMessage } from '../components/Chat';

const EMPTY_SLOTS: Slot[] = [0, 1, 2, 3].map((index) => ({ index, userId: null }));

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const me = useAuth((s) => s.user)!;
  const sockRef = useRef<RoomSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [roomName, setRoomName] = useState('');
  const [slots, setSlots] = useState<Slot[]>(EMPTY_SLOTS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [claps, setClaps] = useState<Record<string, number>>({});

  const mySlot = useMemo(() => slots.find((s) => s.userId === me.id)?.index ?? null, [slots, me.id]);
  const topClappedUserId = useMemo(() => {
    let top: string | null = null;
    let max = 0;
    for (const [uid, n] of Object.entries(claps)) if (n > max) ((max = n), (top = uid));
    return top;
  }, [claps]);

  // Connect once per room.
  useEffect(() => {
    if (!id) return;
    const sock = new RoomSocket();
    sockRef.current = sock;
    sock.connect();
    sock.send({ type: 'enter_room', roomId: id, visible: true });

    const off = sock.on((e: ServerEvent) => handleEvent(e));
    return () => {
      off();
      sock.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function applySlots(raw: Array<{ index: number; userId: string | null; user?: { username?: string } }>) {
    setSlots(
      EMPTY_SLOTS.map((empty) => {
        const found = raw.find((s) => s.index === empty.index);
        return found
          ? { index: empty.index, userId: found.userId, username: found.user?.username }
          : empty;
      }),
    );
  }

  function handleEvent(e: ServerEvent) {
    switch (e.type) {
      case 'room_state': {
        const room = e.room as { name: string; slots: Slot[]; viewerCount: number };
        setRoomName(room.name);
        applySlots(room.slots as never);
        setViewerCount(room.viewerCount);
        break;
      }
      case 'participant_joined':
        setSlots((prev) =>
          prev.map((s) =>
            s.index === e.slotIndex
              ? { ...s, userId: e.userId as string, username: e.username as string }
              : s,
          ),
        );
        break;
      case 'participant_left':
      case 'slot_freed':
        setSlots((prev) => prev.map((s) => (s.index === e.slotIndex ? { index: s.index, userId: null } : s)));
        break;
      case 'new_message':
        setMessages((prev) => [...prev, e.message as ChatMessage]);
        break;
      case 'clap_received':
        setClaps((prev) => ({ ...prev, [e.targetUserId as string]: e.totalClaps as number }));
        break;
      case 'viewer_entered':
        setViewerCount((c) => c + 1);
        break;
      case 'viewer_left':
        setViewerCount((c) => Math.max(0, c - 1));
        break;
    }
  }

  async function joinSlot(index: number) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
    } catch {
      // Allow joining audio-less if camera denied; media wiring is Phase 3.
    }
    sockRef.current?.send({ type: 'join_slot', roomId: id, slotIndex: index });
  }

  function leaveSlot() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    sockRef.current?.send({ type: 'leave_slot', roomId: id });
  }

  const sendMessage = (content: string) =>
    sockRef.current?.send({ type: 'send_message', roomId: id, content });
  const clap = (userId: string) =>
    sockRef.current?.send({ type: 'clap', roomId: id, targetUserId: userId });

  const slotsWithClaps = slots.map((s) => ({ ...s, claps: s.userId ? claps[s.userId] ?? 0 : 0 }));

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Discover
          </Link>
          <h1 className="text-xl font-bold">{roomName || 'Room'}</h1>
        </div>
        <span className="text-sm text-zinc-400">👁 {viewerCount} watching</span>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Carousel
          slots={slotsWithClaps}
          mySlot={mySlot}
          myUserId={me.id}
          localStream={localStream}
          topClappedUserId={topClappedUserId}
          onJoin={joinSlot}
          onLeave={leaveSlot}
          onClap={clap}
        />
        <div className="h-[70vh] lg:h-auto">
          <Chat messages={messages} onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}
