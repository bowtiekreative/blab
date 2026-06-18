import { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  username: string;
  content: string;
  type: string;
}

interface Props {
  messages: ChatMessage[];
  onSend: (content: string) => void;
}

export default function Chat({ messages, onSend }: Props) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    onSend(content);
    setText('');
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.map((m) => (
          <div key={m.id}>
            {m.type === 'system' ? (
              <span className="text-xs italic text-zinc-500">{m.content}</span>
            ) : (
              <span>
                <span className="font-semibold text-indigo-400">@{m.username}</span>{' '}
                <span className="text-zinc-200">{m.content}</span>
              </span>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-zinc-800 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold hover:bg-indigo-500">
          Send
        </button>
      </form>
    </div>
  );
}
