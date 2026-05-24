import { useState } from 'react';
import api from '../api/axios';

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'full_body',
];
const EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'other'];

export default function AddExerciseModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', muscleGroup: 'chest', equipment: 'other' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/exercises', form);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exercise');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Add Custom Exercise</h3>
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Exercise Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Paused Squat"
              required
            />
          </div>
          <div>
            <label className="label">Muscle Group</label>
            <select
              className="input"
              value={form.muscleGroup}
              onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Equipment</label>
            <select
              className="input"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            >
              {EQUIPMENT.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : 'Add Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
