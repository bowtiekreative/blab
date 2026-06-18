import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Login() {
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(username.trim());
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Hustle Zone</h1>
          <p className="mt-1 text-sm text-zinc-400">Jump on the carousel. Get to work.</p>
        </div>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="pick a username"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-indigo-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-500"
        >
          Enter (dev login)
        </button>
        <p className="text-center text-xs text-zinc-600">
          OAuth (Google / Facebook / X) lands in a later phase.
        </p>
      </form>
    </div>
  );
}
