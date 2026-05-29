import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { STATUS_COLORS, SPLIT_LABELS } from '../utils/mesocycleConstants';

export default function MesocycleList() {
  const [mesocycles, setMesocycles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mesocycles')
      .then((res) => setMesocycles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function deleteMeso(id) {
    if (!confirm('Delete this mesocycle?')) return;
    try {
      await api.delete(`/mesocycles/${id}`);
      setMesocycles((prev) => prev.filter((m) => m._id !== id));
    } catch {
      // delete failed — list unchanged, nothing shown to user
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Mesocycles</h2>
          <p className="text-gray-500 mt-1">All your training blocks</p>
        </div>
        <Link to="/mesocycles/new" className="btn-primary">
          + New Mesocycle
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : mesocycles.length === 0 ? (
        <div className="card border-dashed border-gray-700 text-center py-16">
          <p className="text-gray-400 mb-4">No mesocycles yet.</p>
          <Link to="/mesocycles/new" className="btn-primary">
            Create Your First Mesocycle
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mesocycles.map((m) => (
            <div key={m._id} className="card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-100 text-lg">{m.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {SPLIT_LABELS[m.splitType]} · {m.weeks} weeks
                  </p>
                  {m.startDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Start: {new Date(m.startDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${STATUS_COLORS[m.status]}`}
                >
                  {m.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Link to={`/mesocycles/${m._id}`} className="btn-primary flex-1 text-center">
                  Train
                </Link>
                <Link to={`/mesocycles/${m._id}/edit`} className="btn-secondary px-4 text-center">
                  Edit
                </Link>
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
