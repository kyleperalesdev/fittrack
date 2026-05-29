import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { SPLIT_LABELS } from '../utils/mesocycleConstants';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Convert JS Date.getDay() (0=Sun) to Mon-based index (0=Mon … 6=Sun)
function todayDayIndex() {
  const js = new Date().getDay();
  return js === 0 ? 6 : js - 1;
}

function currentWeekNumber(startDate, totalWeeks) {
  if (!startDate) return 1;
  const elapsed = Date.now() - new Date(startDate).getTime();
  const week = Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(Math.max(1, week), totalWeeks);
}

export default function MesocycleTracker() {
  const { id } = useParams();
  const [mesocycle, setMesocycle] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/mesocycles/${id}`),
      api.get(`/sessions?mesocycleId=${id}`),
    ])
      .then(([mesoRes, sessionsRes]) => {
        const m = mesoRes.data;
        setMesocycle(m);
        setSessions(sessionsRes.data);
        setSelectedWeek(currentWeekNumber(m.startDate, m.weeks));
      })
      .catch(() => setError('Failed to load mesocycle'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Loading…
      </div>
    );
  }
  if (error && !mesocycle) {
    return <div className="text-center py-20 text-red-400">{error}</div>;
  }
  if (!mesocycle) return null;

  const dayIndex = todayDayIndex();
  const todayTemplate = mesocycle.weekTemplate.find((d) => d.dayIndex === dayIndex);
  const todaySession = sessions.find(
    (s) => s.week === selectedWeek && s.dayIndex === dayIndex
  );

  const weeks = Array.from({ length: mesocycle.weeks }, (_, i) => i + 1);
  const trainingDays = mesocycle.weekTemplate.filter((d) => !d.isRestDay).length;
  const weekDone = sessions.filter((s) => s.week === selectedWeek && s.completed).length;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">{mesocycle.name}</h2>
          <p className="text-gray-500 mt-1">
            {SPLIT_LABELS[mesocycle.splitType]} · {mesocycle.weeks} weeks
            {mesocycle.startDate && (
              <> · Started {new Date(mesocycle.startDate).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <Link to={`/mesocycles/${id}/edit`} className="btn-secondary shrink-0">
          Edit Plan
        </Link>
      </div>

      {/* ── Today's Workout ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Today · {DAY_NAMES[dayIndex]}
        </p>
        <TodayCard
          day={todayTemplate}
          session={todaySession}
          mesocycleId={id}
          week={selectedWeek}
        />
      </section>

      {/* ── Week Overview ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Week Overview
          </p>
          {/* Week tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {weeks.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  selectedWeek === w
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Week {w}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="grid grid-cols-7 gap-2 min-w-[420px] px-4 md:px-0">
          {mesocycle.weekTemplate.map((day) => {
            const s = sessions.find(
              (x) => x.week === selectedWeek && x.dayIndex === day.dayIndex
            );
            const isToday = day.dayIndex === dayIndex;
            const isCompleted = s?.completed === true;
            const isStarted = s && !s.completed;

            return (
              <DayMiniCard
                key={day.dayIndex}
                day={day}
                isToday={isToday}
                isCompleted={isCompleted}
                isStarted={isStarted}
                href={
                  day.isRestDay
                    ? null
                    : `/mesocycles/${id}/session/${selectedWeek}/${day.dayIndex}`
                }
              />
            );
          })}
        </div>
        </div>

        {trainingDays > 0 && (
          <p className="text-xs text-gray-500">
            Week {selectedWeek}: {weekDone} of {trainingDays} training days completed
          </p>
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TodayCard({ day, session, mesocycleId, week }) {
  if (!day) {
    return (
      <div className="card border-gray-700 text-gray-500 text-sm py-8 text-center">
        No day template found for today.
      </div>
    );
  }

  if (day.isRestDay) {
    return (
      <div className="card border-gray-700 flex items-center gap-4">
        <div className="text-3xl text-gray-600">⏸</div>
        <div>
          <p className="font-bold text-gray-300 text-lg">Rest Day</p>
          <p className="text-sm text-gray-500">Recovery is part of the plan.</p>
        </div>
      </div>
    );
  }

  const isCompleted = session?.completed === true;
  const isStarted = session && !session.completed;
  const href = `/mesocycles/${mesocycleId}/session/${week}/${day.dayIndex}`;

  return (
    <div
      className={`card flex items-center justify-between gap-4 flex-wrap ${
        isCompleted
          ? 'border-brand-700 bg-brand-900/20'
          : isStarted
          ? 'border-yellow-700 bg-yellow-900/10'
          : 'border-gray-700'
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-100 text-xl">{day.label}</p>
          {isCompleted && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-900/50 text-brand-300 border border-brand-700">
              Completed
            </span>
          )}
          {isStarted && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700">
              In Progress
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
          {day.muscleGroups?.length > 0 && (
            <> · {day.muscleGroups.join(', ')}</>
          )}
        </p>
      </div>

      <Link
        to={href}
        className={isCompleted ? 'btn-secondary' : 'btn-primary'}
      >
        {isCompleted ? 'View Session' : isStarted ? 'Continue Workout' : 'Start Workout'}
      </Link>
    </div>
  );
}

function DayMiniCard({ day, isToday, isCompleted, isStarted, href }) {
  const inner = (
    <div
      className={`flex flex-col items-center py-3 px-1 rounded-xl border text-center transition-all ${
        day.isRestDay
          ? 'bg-gray-900/30 border-gray-800 opacity-40 cursor-default'
          : isCompleted
          ? 'bg-brand-900/30 border-brand-700 hover:border-brand-500 cursor-pointer'
          : isStarted
          ? 'bg-yellow-900/20 border-yellow-800 hover:border-yellow-600 cursor-pointer'
          : isToday
          ? 'bg-gray-700/40 border-gray-500 hover:border-gray-400 cursor-pointer'
          : 'bg-gray-800/40 border-gray-700 hover:border-gray-500 cursor-pointer'
      }`}
    >
      <span className={`text-xs font-medium ${isToday ? 'text-brand-400' : 'text-gray-500'}`}>
        {DAY_NAMES[day.dayIndex]}
      </span>
      <span className="text-xs font-semibold text-gray-200 mt-0.5 leading-tight truncate w-full px-1">
        {day.label}
      </span>
      <span className="text-xs mt-1.5">
        {day.isRestDay
          ? <span className="text-gray-600">—</span>
          : isCompleted
          ? <span className="text-brand-400">✓</span>
          : isStarted
          ? <span className="text-yellow-400">●</span>
          : <span className="text-gray-600">·</span>}
      </span>
    </div>
  );

  if (!href) return inner;
  return <Link to={href}>{inner}</Link>;
}
