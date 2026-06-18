import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RoomSocket, type ServerEvent } from '../api/ws';
import { api, type Gift } from '../api/client';
import { useAuth } from '../store/auth';
import { useLiveKit } from '../media/useLiveKit';
import Carousel, { type Slot } from '../components/Carousel';
import Chat, { type ChatMessage } from '../components/Chat';
import GiftPicker from '../components/GiftPicker';

const EMPTY_SLOTS: Slot[] = [0, 1, 2, 3].map((index) => ({ index, userId: null }));

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const me = useAuth((s) => s.user)!;
  const sockRef = useRef<RoomSocket | null>(null);
  const { mode, streams, startPublishing, stopPublishing } = useLiveKit(id, me.id);

  const [roomName, setRoomName] = useState('');
  const [slots, setSlots] = useState<Slot[]>(EMPTY_SLOTS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [claps, setClaps] = useState<Record<string, number>>({});
  const [balance, setBalance] = useState(0);
  const [catalog, setCatalog] = useState<Gift[]>([]);
  const [giftTarget, setGiftTarget] = useState<{ userId: string; username: string } | null>(null);

  // Load wallet balance + gift catalog once.
  useEffect(() => {
    api.balance().then((w) => setBalance(w.balance)).catch(() => {});
    api.giftCatalog().then(setCatalog).catch(() => {});
  }, []);

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
      case 'gift_sent':
        setMessages((prev) => [
          ...prev,
          {
            id: `gift-${Date.now()}-${Math.random()}`,
            username: '',
            type: 'system',
            content: `🎁 @${e.fromUsername} sent ${e.icon} to a host`,
          },
        ]);
        // Refresh my balance if I sent it.
        if (e.fromUserId === me.id) api.balance().then((w) => setBalance(w.balance)).catch(() => {});
        break;
      case 'viewer_entered':
        setViewerCount((c) => c + 1);
        break;
      case 'viewer_left':
        setViewerCount((c) => Math.max(0, c - 1));
        break;

      // --- Tier 1 governance (live) ---
      case 'message_deleted':
        setMessages((prev) => prev.filter((m) => m.id !== e.messageId));
        break;
      case 'chat_cleared':
        setMessages([]);
        sysMessage('Chat was cleared by a moderator');
        break;
      case 'participant_kicked':
        if (e.userId === me.id) {
          void stopPublishing();
          sysMessage('You were removed from the stage');
        }
        break;
      case 'user_warned':
        if (e.userId === me.id) sysMessage(`⚠️ You were warned${e.reason ? `: ${e.reason}` : ''}`);
        break;
      case 'user_banned_from_room':
        if (e.userId === me.id) {
          void stopPublishing();
          alert('You have been banned from this room.');
          window.location.assign('/');
        }
        break;
      case 'room_banned':
      case 'room_ended':
        sysMessage(e.type === 'room_banned' ? 'This room was removed by staff' : 'The room has ended');
        break;
    }
  }

  function sysMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      { id: `sys-${Date.now()}-${Math.random()}`, username: '', type: 'system', content },
    ]);
  }

  async function reportRoom() {
    if (!id) return;
    const reason = window.prompt('Report this room — reason (harassment, spam, nsfw, hate_speech, illegal, other):', 'other');
    if (!reason) return;
    try {
      await api.report('room', id, reason.trim());
      sysMessage('Report submitted. Thank you.');
    } catch (err) {
      sysMessage(`Could not submit report: ${(err as Error).message}`);
    }
  }

  async function joinSlot(index: number) {
    try {
      await startPublishing();
    } catch {
      // Allow taking the slot even if camera/mic is denied.
    }
    sockRef.current?.send({ type: 'join_slot', roomId: id, slotIndex: index });
  }

  function leaveSlot() {
    void stopPublishing();
    sockRef.current?.send({ type: 'leave_slot', roomId: id });
  }

  const sendMessage = (content: string) =>
    sockRef.current?.send({ type: 'send_message', roomId: id, content });
  const clap = (userId: string) =>
    sockRef.current?.send({ type: 'clap', roomId: id, targetUserId: userId });

  function openGift(userId: string) {
    const username = slots.find((s) => s.userId === userId)?.username ?? userId.slice(0, 6);
    setGiftTarget({ userId, username });
  }
  async function sendGift(giftType: string) {
    if (!id || !giftTarget) return;
    try {
      await api.sendGift(id, giftType, giftTarget.userId);
      const w = await api.balance();
      setBalance(w.balance);
    } catch {
      // Insufficient funds etc. surface via the disabled state in the picker.
    }
    setGiftTarget(null);
  }

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
        <span className="flex items-center gap-3 text-sm text-zinc-400">
          {mode === 'local' && <span className="text-amber-400">local preview</span>}
          <span className="rounded-full bg-zinc-800 px-3 py-1 font-semibold text-amber-300">
            ⏣ {balance}
          </span>
          👁 {viewerCount} watching
          <button onClick={reportRoom} className="text-zinc-500 hover:text-red-400" title="Report room">
            ⚐ Report
          </button>
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Carousel
          slots={slotsWithClaps}
          myUserId={me.id}
          streams={streams}
          topClappedUserId={topClappedUserId}
          onJoin={joinSlot}
          onLeave={leaveSlot}
          onClap={clap}
          onGift={openGift}
        />
        <div className="h-[70vh] lg:h-auto">
          <Chat messages={messages} onSend={sendMessage} />
        </div>
      </div>

      {giftTarget && (
        <GiftPicker
          catalog={catalog}
          recipientName={giftTarget.username}
          balance={balance}
          onSend={sendGift}
          onClose={() => setGiftTarget(null)}
        />
      )}
    </div>
  );
}
