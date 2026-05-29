import { useState, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Data helpers ─────────────────────────────────────────────────────────────

const UPPER_GROUPS = new Set(['chest', 'back', 'shoulders', 'biceps', 'triceps']);

function isUpperDay(day) {
  return day?.muscleGroups?.some((g) => UPPER_GROUPS.has(g));
}

// Weekly volume (kg × reps) split into upper / lower buckets
function buildVolumeData(sessions, weekTemplate, totalWeeks) {
  const dayType = new Map(
    weekTemplate.map((d) => [d.dayIndex, isUpperDay(d) ? 'upper' : 'lower'])
  );

  return Array.from({ length: totalWeeks }, (_, i) => {
    const week = i + 1;
    let upper = 0;
    let lower = 0;

    for (const s of sessions.filter((s) => s.week === week && s.completed)) {
      const bucket = dayType.get(s.dayIndex) ?? 'lower';
      for (const ex of s.exercises) {
        for (const set of ex.sets) {
          if (set.completed && set.weight && set.reps) {
            const vol = set.weight * set.reps;
            if (bucket === 'upper') upper += vol;
            else lower += vol;
          }
        }
      }
    }

    return { week: `W${week}`, upper: Math.round(upper), lower: Math.round(lower) };
  });
}

// All distinct exercises found across sessions, sorted by name
function buildExerciseList(sessions) {
  const map = new Map();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const id = (ex.exercise._id ?? ex.exercise).toString();
      if (!map.has(id)) {
        map.set(id, ex.exercise.name ?? id);
      }
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Max weight used in a completed set for a given exercise, per week
function buildStrengthData(sessions, exerciseId, totalWeeks) {
  const points = [];
  for (let week = 1; week <= totalWeeks; week++) {
    let max = null;
    for (const s of sessions.filter((s) => s.week === week)) {
      for (const ex of s.exercises) {
        const id = (ex.exercise._id ?? ex.exercise).toString();
        if (id !== exerciseId) continue;
        for (const set of ex.sets) {
          if (set.completed && set.weight != null) {
            max = Math.max(max ?? 0, set.weight);
          }
        }
      }
    }
    if (max !== null) points.push({ week: `W${week}`, weight: max });
  }
  return points;
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────

function VolumeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4" style={{ color: p.fill }}>
          <span>{p.name}</span>
          <span className="font-semibold">{(p.value / 1000).toFixed(1)}k kg</span>
        </p>
      ))}
      <p className="flex justify-between gap-4 text-gray-200 mt-1.5 pt-1.5 border-t border-gray-700">
        <span>Total</span>
        <span className="font-semibold">{(total / 1000).toFixed(1)}k kg</span>
      </p>
    </div>
  );
}

function StrengthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      <p className="text-brand-300 font-semibold">{payload[0].value} kg</p>
    </div>
  );
}

// ─── Shared axis / grid styles ────────────────────────────────────────────────

const AXIS_STYLE = { fill: '#6b7280', fontSize: 11 };
const GRID_COLOR = '#1f2937';

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = ['Volume', 'Strength'];

export default function ProgressCharts({ sessions, mesocycle }) {
  const [tab, setTab] = useState('Volume');
  const [selectedExId, setSelectedExId] = useState(null);

  const exerciseList = useMemo(() => buildExerciseList(sessions), [sessions]);
  const activeExId = selectedExId ?? exerciseList[0]?.id ?? null;

  const volumeData = useMemo(
    () => buildVolumeData(sessions, mesocycle.weekTemplate, mesocycle.weeks),
    [sessions, mesocycle]
  );

  const strengthData = useMemo(
    () => (activeExId ? buildStrengthData(sessions, activeExId, mesocycle.weeks) : []),
    [sessions, activeExId, mesocycle.weeks]
  );

  const hasVolume = volumeData.some((d) => d.upper + d.lower > 0);
  const activeExName = exerciseList.find((e) => e.id === activeExId)?.name ?? '';

  return (
    <section className="space-y-4">
      {/* Section header + tab switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Progress
        </p>
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors ${
                tab === t
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Volume tab ── */}
      {tab === 'Volume' && (
        <div className="card p-4 md:p-5 space-y-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-medium text-gray-200">Weekly Training Volume</p>
              <p className="text-xs text-gray-500 mt-0.5">Total weight lifted (kg × reps)</p>
            </div>
            <div className="flex items-center gap-3">
              <Legend color="bg-brand-600" label="Upper" />
              <Legend color="bg-blue-600" label="Lower" />
            </div>
          </div>

          {hasVolume ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeData} barCategoryGap="35%" margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="week" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  width={32}
                />
                <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="upper" name="Upper" stackId="a" fill="#7c3aed" />
                <Bar dataKey="lower" name="Lower" stackId="a" fill="#2563eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Complete sessions to see your volume progression." />
          )}
        </div>
      )}

      {/* ── Strength tab ── */}
      {tab === 'Strength' && (
        <div className="card p-4 md:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-gray-200">Weight Progression</p>
              <p className="text-xs text-gray-500 mt-0.5">Max weight per session</p>
            </div>
            <select
              className="input text-xs py-1.5 w-auto max-w-[200px]"
              value={activeExId ?? ''}
              onChange={(e) => setSelectedExId(e.target.value)}
            >
              {exerciseList.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {exerciseList.length === 0 ? (
            <EmptyState text="Complete sessions to track your strength progression." />
          ) : strengthData.length >= 1 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={strengthData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="week" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={AXIS_STYLE}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                    domain={['auto', 'auto']}
                    width={32}
                  />
                  <Tooltip content={<StrengthTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#a78bfa', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Delta badge */}
              {strengthData.length >= 2 && (() => {
                const first = strengthData[0].weight;
                const last = strengthData[strengthData.length - 1].weight;
                const diff = last - first;
                const pct = ((diff / first) * 100).toFixed(1);
                return (
                  <p className="text-xs text-gray-500">
                    {activeExName}:{' '}
                    <span className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {diff >= 0 ? '+' : ''}{diff} kg ({diff >= 0 ? '+' : ''}{pct}%)
                    </span>
                    {' '}over this mesocycle
                  </p>
                );
              })()}
            </>
          ) : (
            <EmptyState text={`No weight data for ${activeExName} yet.`} />
          )}
        </div>
      )}
    </section>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center h-[200px]">
      <p className="text-sm text-gray-600 text-center max-w-[200px]">{text}</p>
    </div>
  );
}
