import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { STATUS_COLORS, SPLIT_LABELS } from '../utils/mesocycleConstants';

// A cycle is effectively expired when its start date puts us past the final week.
function computedStatus(m) {
  if (m.status !== 'active' || !m.startDate) return m.status;
  const elapsed = Date.now() - new Date(m.startDate).getTime();
  const week = Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1;
  return week > m.weeks ? 'completed' : 'active';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [mesocycles, setMesocycles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mesocycles')
      .then(async (res) => {
        const list = res.data;

        // Patch any active cycle whose date range has fully passed,
        // and update local state immediately so no refresh is needed.
        const patches = list
          .filter((m) => m.status === 'active' && computedStatus(m) === 'completed')
          .map((m) =>
            api.put(`/mesocycles/${m._id}`, { status: 'completed' })
              .then(() => { m.status = 'completed'; })
              .catch(() => {})
          );

        await Promise.all(patches);
        setMesocycles([...list]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active    = mesocycles.find((m) => computedStatus(m) === 'active');
  const planned   = mesocycles.filter((m) => m.status === 'planned');
  const completed = mesocycles.filter((m) => computedStatus(m) === 'completed');
  const recent    = mesocycles.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-gray-500 mt-1">Here's your training overview</p>
      </div>

      {/* ── Active mesocycle banner ── */}
      {!loading && active && (
        <div className="card border-brand-700 bg-brand-900/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">
                Active Mesocycle
              </span>
              <h3 className="text-lg font-bold text-gray-100 mt-0.5">{active.name}</h3>
              <p className="text-sm text-gray-400">
                {SPLIT_LABELS[active.splitType]} · {active.weeks} weeks
                {active.startDate && (
                  <> · Started {new Date(active.startDate).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <Link to={`/mesocycles/${active._id}`} className="btn-primary shrink-0">
              Train Now
            </Link>
          </div>
        </div>
      )}

      {/* ── No active cycle — contextual empty state ── */}
      {!loading && !active && <NoActiveCycleCard planned={planned} completed={completed} />}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Plans',  value: mesocycles.length },
          { label: 'Active',       value: mesocycles.filter((m) => computedStatus(m) === 'active').length },
          { label: 'Completed',    value: completed.length },
          { label: 'Planned',      value: planned.length },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-3xl font-bold text-brand-400">{loading ? '—' : value}</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Recent mesocycles list ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">Recent Mesocycles</h3>
          <Link to="/mesocycles" className="text-sm text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No mesocycles yet.</div>
        ) : (
          <div className="space-y-3">
            {recent.map((m) => {
              const status = computedStatus(m);
              return (
                <Link
                  key={m._id}
                  to={`/mesocycles/${m._id}`}
                  className="card flex items-center justify-between hover:border-gray-600 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-100">{m.name}</p>
                    <p className="text-sm text-gray-500">
                      {SPLIT_LABELS[m.splitType]} · {m.weeks} weeks
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${STATUS_COLORS[status]}`}>
                    {status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Contextual empty state ───────────────────────────────────────────────────

function NoActiveCycleCard({ planned, completed }) {
  if (planned.length > 0) {
    const next = planned[0];
    return (
      <div className="card border-gray-700 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-900/50 border border-blue-700 flex items-center justify-center shrink-0 text-blue-300 text-lg">
            ◷
          </div>
          <div>
            <p className="font-semibold text-gray-200">You have a cycle ready to go</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Set <span className="text-gray-300">{next.name}</span> as active to begin training.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/mesocycles/${next._id}/edit`} className="btn-primary">
            Set as Active
          </Link>
          {planned.length > 1 && (
            <Link to="/mesocycles" className="btn-secondary">
              View all ({planned.length})
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (completed.length > 0) {
    const last = completed[0];
    return (
      <div className="card border-brand-800/60 bg-brand-900/10 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-900/60 border border-brand-700 flex items-center justify-center shrink-0 text-brand-300 text-lg">
            ✓
          </div>
          <div>
            <p className="font-semibold text-gray-200">No active mesocycle</p>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="text-gray-300">{last.name}</span> is complete.
              Keep the momentum — start your next cycle.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/mesocycles/new" className="btn-primary">+ New Mesocycle</Link>
          <Link to={`/mesocycles/${last._id}`} className="btn-secondary">Review Last Cycle</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-dashed border-gray-700 text-center py-12 space-y-3">
      <p className="text-gray-300 font-medium">No mesocycles yet</p>
      <p className="text-sm text-gray-500">Plan your first training block to get started.</p>
      <Link to="/mesocycles/new" className="btn-primary inline-block mt-2">
        Create Mesocycle
      </Link>
    </div>
  );
}
