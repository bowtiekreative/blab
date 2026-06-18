import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Room } from '../api/client';
import { useAuth } from '../store/auth';

export default function Discover() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState('');

  async function refresh() {
    setRooms(await api.listRooms());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const room = await api.createRoom({ name: name.trim() });
    await api.startRoom(room.id);
    navigate(`/room/${room.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hustle Zone</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">@{user?.username}</span>
          <button onClick={logout} className="text-zinc-500 hover:text-zinc-300">
            logout
          </button>
        </div>
      </header>

      <form onSubmit={createRoom} className="mb-8 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Start a room…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 outline-none focus:border-indigo-500"
        />
        <button className="rounded-lg bg-indigo-600 px-5 font-semibold hover:bg-indigo-500">
          Go Live
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Live now
      </h2>
      {rooms.length === 0 ? (
        <p className="text-zinc-500">No rooms yet — start one above.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/room/${room.id}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-indigo-600"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{room.name}</h3>
                {room.is_live && (
                  <span className="rounded bg-red-600/20 px-2 py-0.5 text-xs font-bold text-red-400">
                    LIVE
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-400">@{room.host_username}</p>
              <p className="mt-2 text-xs text-zinc-500">
                👁 {room.stats.viewerCount} · {room.slots.filter((s) => s.userId).length}/4 on stage
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
