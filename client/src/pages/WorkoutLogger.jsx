import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MUSCLE_COLORS = {
  chest: 'text-red-400',
  back: 'text-orange-400',
  shoulders: 'text-yellow-400',
  biceps: 'text-green-400',
  triceps: 'text-teal-400',
  legs: 'text-blue-400',
  glutes: 'text-purple-400',
  core: 'text-pink-400',
  full_body: 'text-gray-400',
};

const FEELINGS = [
  {
    id: 'easy',
    label: 'Too Easy',
    activeClass: 'text-sky-300 border-sky-600 bg-sky-900/30',
    // next session: +2 reps
    repDelta: +2,
  },
  {
    id: 'good',
    label: 'Good',
    activeClass: 'text-green-300 border-green-600 bg-green-900/30',
    // next session: +1 rep (default)
    repDelta: +1,
  },
  {
    id: 'hard',
    label: 'Hard',
    activeClass: 'text-yellow-300 border-yellow-600 bg-yellow-900/30',
    // next session: hold reps, don't increase
    repDelta: 0,
  },
  {
    id: 'fail',
    label: "Couldn't Finish",
    activeClass: 'text-red-300 border-red-700 bg-red-900/30',
    // next session: pull back slightly
    repDelta: -1,
  },
];

const FEELING_IDLE = 'text-gray-500 border-gray-700 hover:border-gray-500 hover:text-gray-300';

function feelingById(id) {
  return FEELINGS.find((f) => f.id === id) ?? null;
}

// Derive rep target for this session based on previous reps + how that session felt.
function calcRepTarget(prevReps, prevFeeling) {
  if (prevReps == null) return null;
  const delta = feelingById(prevFeeling)?.repDelta ?? +1;
  return Math.max(1, prevReps + delta);
}

// Build a map of exerciseId → { weight, reps, feeling } from the most recent
// prior session sharing the same dayIndex (Upper A → last Upper A, etc.).
function buildPrevPerformance(sessions, dayIdx, weekNum) {
  const prev = sessions
    .filter((s) => s.dayIndex === dayIdx && s.week < weekNum)
    .sort((a, b) => b.week - a.week)[0];

  if (!prev) return new Map();

  const map = new Map();
  for (const exLog of prev.exercises) {
    const exId = (exLog.exercise._id ?? exLog.exercise).toString();
    const done = exLog.sets.filter((s) => s.completed && s.reps != null);
    if (done.length === 0) continue;
    const bestReps = Math.max(...done.map((s) => s.reps));
    const lastWeight = done[done.length - 1].weight;
    map.set(exId, {
      weight: lastWeight,
      reps: bestReps,
      feeling: exLog.feeling ?? null,
    });
  }
  return map;
}

export default function WorkoutLogger() {
  const { id, week, dayIndex } = useParams();
  const navigate = useNavigate();

  const weekNum = parseInt(week, 10);
  const dayIdx = parseInt(dayIndex, 10);

  const [mesocycle, setMesocycle] = useState(null);
  const [day, setDay] = useState(null);
  const [existingSession, setExistingSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [prevPerformance, setPrevPerformance] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/mesocycles/${id}`),
      api.get(`/sessions?mesocycleId=${id}`),
    ])
      .then(([mesoRes, sessionsRes]) => {
        const m = mesoRes.data;
        const allSessions = sessionsRes.data;
        setMesocycle(m);

        const templateDay = m.weekTemplate.find((d) => d.dayIndex === dayIdx);
        setDay(templateDay ?? null);

        const existing = allSessions.find(
          (s) => s.week === weekNum && s.dayIndex === dayIdx
        );

        const prevMap = buildPrevPerformance(allSessions, dayIdx, weekNum);
        setPrevPerformance(prevMap);

        if (existing) {
          setExistingSession(existing);
          setExercises(
            existing.exercises.map((ex) => ({
              ...ex,
              feeling: ex.feeling ?? null,
              sets: ex.sets.map((s) => ({ ...s })),
            }))
          );
        } else {
          // New session — pre-fill weights from previous week's same day
          setExercises(
            (templateDay?.exercises ?? []).map((ex) => {
              const exId = (ex.exercise._id ?? ex.exercise).toString();
              const prev = prevMap.get(exId);
              return {
                exercise: ex.exercise,
                feeling: null,
                sets: Array.from({ length: ex.sets }, () => ({
                  weight: prev?.weight ?? null,
                  reps: null,
                  rpe: null,
                  completed: false,
                })),
              };
            })
          );
        }
      })
      .catch(() => setError('Failed to load workout'))
      .finally(() => setLoading(false));
  }, [id, weekNum, dayIdx]);

  // Prescribed targets from the template (keyed by exercise ID)
  const prescribed = new Map(
    (day?.exercises ?? []).map((ex) => {
      const exId = (ex.exercise._id ?? ex.exercise).toString();
      return [exId, { reps: ex.reps, rpe: ex.rpe }];
    })
  );

  function updateSet(exIdx, setIdx, patch) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
          : ex
      )
    );
  }

  function updateFeeling(exIdx, feelingId) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, feeling: ex.feeling === feelingId ? null : feelingId }
          : ex
      )
    );
  }

  async function save(completed) {
    setSaving(true);
    setError('');
    try {
      const payload = {
        mesocycle: id,
        week: weekNum,
        dayIndex: dayIdx,
        completed,
        exercises: exercises.map((ex) => ({
          exercise: ex.exercise._id ?? ex.exercise,
          sets: ex.sets,
          feeling: ex.feeling ?? null,
        })),
      };

      if (existingSession) {
        await api.put(`/sessions/${existingSession._id}`, {
          completed,
          exercises: payload.exercises,
        });
      } else {
        const res = await api.post('/sessions', payload);
        setExistingSession(res.data);
      }

      navigate(`/mesocycles/${id}`);
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Loading…
      </div>
    );
  }

  if (error && !mesocycle) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-400">{error}</p>
        <Link to={`/mesocycles/${id}`} className="btn-secondary">
          Back to Tracker
        </Link>
      </div>
    );
  }

  if (!day) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-400">Day not found in this mesocycle.</p>
        <Link to={`/mesocycles/${id}`} className="btn-secondary">
          Back to Tracker
        </Link>
      </div>
    );
  }

  const isCompleted = existingSession?.completed === true;

  // ── Full-page layout ──────────────────────────────────────────────────────

  return (
    <div className="-mx-4 md:-mx-6 -my-5 md:-my-8 h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-5rem)] flex flex-col">

      {/* Sticky header */}
      <div className="shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-800 bg-gray-950">
        <Link
          to={`/mesocycles/${id}`}
          className="text-gray-400 hover:text-gray-200 transition-colors text-sm font-medium shrink-0"
        >
          ← Back
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">
            {mesocycle.name} · Week {weekNum}
          </p>
          <h2 className="font-bold text-gray-100 truncate">
            {DAY_NAMES[dayIdx]} — {day.label}
          </h2>
        </div>

        {isCompleted && (
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-900/50 text-brand-300 border border-brand-700">
            Completed
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 md:py-6 space-y-10">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {exercises.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">No exercises in this day.</p>
            <p className="text-sm">Add exercises in the plan editor first.</p>
          </div>
        )}

        {exercises.map((exLog, exIdx) => {
          const exId = (exLog.exercise._id ?? exLog.exercise).toString();
          const target = prescribed.get(exId);
          const prev = prevPerformance.get(exId);
          const exName = exLog.exercise.name ?? '—';
          const exGroup = exLog.exercise.muscleGroup;
          const completedSets = exLog.sets.filter((s) => s.completed).length;

          const repTarget = calcRepTarget(prev?.reps, prev?.feeling);
          const prevFeelingInfo = feelingById(prev?.feeling);

          return (
            <section key={exIdx}>
              {/* Exercise header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase ${MUSCLE_COLORS[exGroup] ?? 'text-gray-400'}`}>
                      {exGroup?.replace('_', ' ')}
                    </span>
                    <h3 className="font-semibold text-gray-100 text-lg">{exName}</h3>
                  </div>

                  {/* Previous performance + adjusted rep target */}
                  {prev ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Last week:{' '}
                      {prev.weight != null
                        ? <span className="text-gray-400">{prev.weight} kg × {prev.reps} reps</span>
                        : <span className="text-gray-400">{prev.reps} reps</span>
                      }
                      {repTarget != null && (
                        <span className="ml-1.5 text-brand-400 font-medium">
                          · target ≥{repTarget}
                          {prevFeelingInfo && (
                            <span className="text-gray-600 font-normal"> ({prevFeelingInfo.label.toLowerCase()})</span>
                          )}
                        </span>
                      )}
                    </p>
                  ) : target ? (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Target: {target.reps} reps{target.rpe ? ` @ RPE ${target.rpe}` : ''}
                    </p>
                  ) : null}
                </div>

                <p className="text-xs text-gray-600 shrink-0 mt-1">
                  {completedSets}/{exLog.sets.length} sets
                </p>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] sm:grid-cols-[3rem_1fr_1fr_1fr_3rem] gap-2 sm:gap-3 mb-2 px-1 text-xs text-gray-500 uppercase tracking-wide">
                <span className="text-center">#</span>
                <span className="text-center">Weight</span>
                <span className="text-center">
                  Reps
                  {repTarget != null && (
                    <span className="ml-1 normal-case text-brand-500">≥{repTarget}</span>
                  )}
                </span>
                <span className="text-center">RPE</span>
                <span />
              </div>

              {/* Set rows */}
              <div className="space-y-2">
                {exLog.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`grid grid-cols-[2rem_1fr_1fr_1fr_2.5rem] sm:grid-cols-[3rem_1fr_1fr_1fr_3rem] gap-2 sm:gap-3 items-center rounded-lg px-1 py-1 transition-colors ${
                      set.completed ? 'bg-brand-900/20' : ''
                    }`}
                  >
                    <span className="text-sm text-gray-400 text-center font-medium">
                      {setIdx + 1}
                    </span>

                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="2.5"
                      value={set.weight ?? ''}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          weight: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="kg"
                      className="input py-2.5 text-center text-sm"
                    />

                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="100"
                      value={set.reps ?? ''}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          reps: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder={repTarget != null ? `${repTarget}` : 'reps'}
                      className="input py-2.5 text-center text-sm"
                    />

                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      max="10"
                      step="0.5"
                      value={set.rpe ?? ''}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          rpe: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="—"
                      className="input py-2.5 text-center text-sm"
                    />

                    <button
                      onClick={() => updateSet(exIdx, setIdx, { completed: !set.completed })}
                      title={set.completed ? 'Mark incomplete' : 'Mark set done'}
                      className={`text-2xl text-center leading-none transition-colors ${
                        set.completed ? 'text-brand-400' : 'text-gray-600 hover:text-gray-300'
                      }`}
                    >
                      {set.completed ? '✓' : '○'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Feeling feedback */}
              <div className="mt-4 pt-3 border-t border-gray-800/60 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 shrink-0">How did it feel?</span>
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {FEELINGS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateFeeling(exIdx, f.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        exLog.feeling === f.id ? f.activeClass : FEELING_IDLE
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {prev?.feeling && (
                  <span className="text-xs text-gray-600 shrink-0">
                    Last: {feelingById(prev.feeling)?.label}
                  </span>
                )}
              </div>
            </section>
          );
        })}

        <div className="h-4" />
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 px-4 md:px-6 py-4 border-t border-gray-800 bg-gray-950 flex gap-3">
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="btn-secondary flex-1"
        >
          {saving ? 'Saving…' : 'Save Progress'}
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="btn-primary flex-1"
        >
          {saving ? 'Saving…' : '✓ Complete Workout'}
        </button>
      </div>
    </div>
  );
}
