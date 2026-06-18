import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type AdminReport, type AdminJailEntry } from '../api/client';

const METRIC_LABELS: Record<string, string> = {
  total_users: 'Total Users',
  dau: 'Daily Active',
  mau: 'Monthly Active',
  rooms_today: 'Rooms Today',
  live_now: 'Live Now',
  tokens_in_circulation: 'Tokens ⏣',
  report_queue: 'Open Reports',
  jail_population: 'In Jail',
};

export default function Admin() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [jail, setJail] = useState<AdminJailEntry[]>([]);

  async function refresh() {
    const [m, r, j] = await Promise.all([api.adminDashboard(), api.adminReports(), api.adminJail()]);
    setMetrics(m);
    setReports(r);
    setJail(j);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function resolve(id: string, resolution: string) {
    await api.resolveReport(id, resolution);
    refresh();
  }
  async function release(userId: string) {
    await api.releaseFromJail(userId);
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Discover
        </Link>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(METRIC_LABELS).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-2xl font-bold">{metrics[key] ?? '—'}</div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Reports queue
        </h2>
        {reports.length === 0 ? (
          <p className="text-zinc-500">No open reports.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm"
              >
                <span>
                  <span className="font-semibold text-red-400">{r.reason}</span> · {r.target_type}{' '}
                  <span className="text-zinc-500">{r.target_id.slice(0, 8)}</span>
                </span>
                <span className="flex gap-2">
                  <button onClick={() => resolve(r.id, 'dismissed')} className="rounded bg-zinc-700 px-2 py-1 text-xs">
                    Dismiss
                  </button>
                  <button onClick={() => resolve(r.id, 'warned')} className="rounded bg-amber-600 px-2 py-1 text-xs">
                    Warn
                  </button>
                  <button onClick={() => resolve(r.id, 'jailed')} className="rounded bg-red-600 px-2 py-1 text-xs">
                    Jail
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Jail population
        </h2>
        {jail.length === 0 ? (
          <p className="text-zinc-500">Nobody in jail.</p>
        ) : (
          <div className="space-y-2">
            {jail.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm"
              >
                <span>
                  <span className="font-semibold">@{u.username}</span>{' '}
                  <span className="text-zinc-500">— {u.reason}</span>
                </span>
                <button onClick={() => release(u.user_id)} className="rounded bg-green-700 px-2 py-1 text-xs">
                  Release
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
