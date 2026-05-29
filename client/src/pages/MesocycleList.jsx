import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { STATUS_COLORS, SPLIT_LABELS } from '../utils/mesocycleConstants';

const FILTERS = [
  { id: 'active',    label: 'Active' },
  { id: 'planned',   label: 'Planned' },
  { id: 'completed', label: 'Completed' },
  { id: 'all',       label: 'All' },
];

export default function MesocycleList() {
  const [mesocycles, setMesocycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [duplicating, setDuplicating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/mesocycles')
      .then((res) => setMesocycles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function duplicateMeso(id) {
    setDuplicating(id);
    try {
      const res = await api.post(`/mesocycles/${id}/duplicate`);
      navigate(`/mesocycles/${res.data._id}/edit`);
    } catch {
      setDuplicating(null);
    }
  }

  async function deleteMeso(id) {
    if (!confirm('Delete this mesocycle?')) return;
    try {
      await api.delete(`/mesocycles/${id}`);
      setMesocycles((prev) => prev.filter((m) => m._id !== id));
    } catch {}
  }

  const filtered = filter === 'all'
    ? mesocycles
    : mesocycles.filter((m) => m.status === filter);

  const counts = {
    active:    mesocycles.filter((m) => m.status === 'active').length,
    planned:   mesocycles.filter((m) => m.status === 'planned').length,
    completed: mesocycles.filter((m) => m.status === 'completed').length,
    all:       mesocycles.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Mesocycles</h2>
          <p className="text-gray-500 mt-1">All your training blocks</p>
        </div>
        <Link to="/mesocycles/new" className="btn-primary shrink-0">
          + New Mesocycle
        </Link>
      </div>

      {/* Filter tabs */}
      {!loading && mesocycles.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filter === f.id
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label}
              {counts[f.id] > 0 && (
                <span className={`ml-1.5 ${filter === f.id ? 'text-brand-200' : 'text-gray-600'}`}>
                  {counts[f.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : mesocycles.length === 0 ? (
        <div className="card border-dashed border-gray-700 text-center py-16">
          <p className="text-gray-400 mb-4">No mesocycles yet.</p>
          <Link to="/mesocycles/new" className="btn-primary">
            Create Your First Mesocycle
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card border-dashed border-gray-700 text-center py-12">
          <p className="text-gray-400">
            No {filter} mesocycles.
          </p>
          {filter === 'active' && (
            <p className="text-sm text-gray-500 mt-1">
              Edit a planned cycle and set its status to Active to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((m) => (
            <div key={m._id} className="card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-100 text-lg">{m.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {SPLIT_LABELS[m.splitType]} · {m.weeks} weeks
                  </p>
                  {m.startDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Started {new Date(m.startDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${STATUS_COLORS[m.status]}`}>
                  {m.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <Link
                  to={`/mesocycles/${m._id}`}
                  className={`flex-1 text-center ${m.status === 'completed' ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {m.status === 'completed' ? 'View' : 'Train'}
                </Link>
                <Link to={`/mesocycles/${m._id}/edit`} className="btn-secondary px-3 text-center">
                  Edit
                </Link>
                <button
                  onClick={() => duplicateMeso(m._id)}
                  disabled={duplicating === m._id}
                  title="Duplicate as new cycle"
                  className="btn-secondary px-3"
                >
                  {duplicating === m._id ? '…' : '⧉'}
                </button>
                <button onClick={() => deleteMeso(m._id)} className="btn-danger px-3">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
