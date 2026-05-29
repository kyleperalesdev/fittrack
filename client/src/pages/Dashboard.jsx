import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { STATUS_COLORS, SPLIT_LABELS } from '../utils/mesocycleConstants';

export default function Dashboard() {
  const { user } = useAuth();
  const [mesocycles, setMesocycles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mesocycles')
      .then((res) => setMesocycles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = mesocycles.find((m) => m.status === 'active');
  const recent = mesocycles.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-gray-500 mt-1">Here's your training overview</p>
      </div>

      {/* Active mesocycle banner */}
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
              </p>
            </div>
            <Link to={`/mesocycles/${active._id}`} className="btn-primary">
              Train Now
            </Link>
          </div>
        </div>
      )}

      {!loading && !active && (
        <div className="card border-dashed border-gray-700 text-center py-10">
          <p className="text-gray-400 mb-4">No active mesocycle. Ready to plan your next block?</p>
          <Link to="/mesocycles/new" className="btn-primary">
            Create Mesocycle
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Plans', value: mesocycles.length },
          { label: 'Active', value: mesocycles.filter((m) => m.status === 'active').length },
          { label: 'Completed', value: mesocycles.filter((m) => m.status === 'completed').length },
          { label: 'Planned', value: mesocycles.filter((m) => m.status === 'planned').length },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-3xl font-bold text-brand-400">{value}</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent mesocycles */}
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
            {recent.map((m) => (
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
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_COLORS[m.status]}`}
                >
                  {m.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
