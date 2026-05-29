import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import api from '../api/axios';
import { useMesocycleBuilder } from '../hooks/useMesocycleBuilder';
import ExerciseSidebar from '../components/ExerciseSidebar';
import DayColumn from '../components/DayColumn';
import AddExerciseModal from '../components/AddExerciseModal';

const SPLITS = [
  { id: 'PPL', label: 'Push / Pull / Legs', desc: '6-day split — push, pull, legs ×2' },
  { id: 'UpperLower', label: 'Upper / Lower', desc: '4-day split — upper & lower alternating' },
  { id: 'FullBody', label: 'Full Body', desc: '3-day split — full body each session' },
  { id: 'BroSplit', label: 'Bro Split', desc: '5-day — one muscle group per day' },
  { id: 'Custom', label: 'Custom', desc: 'Build your own week from scratch' },
];

export default function MesocycleBuilder() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeExercise, setActiveExercise] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(isEdit ? 2 : 1);

  const builder = useMesocycleBuilder();
  const {
    name, setName,
    splitType, setSplitType, selectSplit,
    weeks, setWeeks,
    weekTemplate,
    notes, setNotes,
    addExerciseToDay,
    removeExerciseFromDay,
    updateExercise,
    reorderExercises,
    toggleRestDay,
    toPayload,
    setWeekTemplate,
  } = builder;

  function addClientIds(template) {
    return template.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => ({
        ...ex,
        _clientId: ex._clientId ?? crypto.randomUUID(),
      })),
    }));
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    api.get('/exercises')
      .then((res) => setExercises(res.data))
      .catch(() => setError('Failed to load exercise library'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/mesocycles/${id}`)
      .then((res) => {
        const m = res.data;
        setName(m.name);
        setSplitType(m.splitType);
        setWeeks(m.weeks);
        setNotes(m.notes || '');
        setWeekTemplate(addClientIds(m.weekTemplate ?? []));
        setStep(2);
      })
      .catch(() => setError('Failed to load mesocycle'));
  }, [id]);

  function handleDragStart(event) {
    const { active } = event;
    if (active.data.current?.exercise) {
      setActiveExercise(active.data.current.exercise);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveExercise(null);
    if (!over) return;

    const overId = over.id.toString();

    // Dropped from sidebar onto a day column
    if (active.id.toString().startsWith('exercise-') && overId.startsWith('day-')) {
      const dayIndex = parseInt(overId.replace('day-', ''));
      const exercise = active.data.current.exercise;
      addExerciseToDay(dayIndex, exercise);
      return;
    }

    // Reordering within a day column — detect by data.dayIndex set in useSortable
    if (active.data.current?.dayIndex !== undefined && over.data.current?.dayIndex !== undefined) {
      const activeDayIndex = active.data.current.dayIndex;
      const overDayIndex = over.data.current.dayIndex;

      if (activeDayIndex === overDayIndex) {
        const day = weekTemplate.find((d) => d.dayIndex === activeDayIndex);
        if (!day) return;

        const activeIdx = day.exercises.findIndex((ex) => ex._clientId === active.id);
        const overIdx = day.exercises.findIndex((ex) => ex._clientId === over.id);
        if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
          reorderExercises(activeDayIndex, arrayMove(day.exercises, activeIdx, overIdx));
        }
      }
    }
  }

  async function handleSave() {
    if (!name.trim()) { setError('Please enter a mesocycle name'); return; }
    if (!splitType) { setError('Please select a split type'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = toPayload();
      if (isEdit) {
        await api.put(`/mesocycles/${id}`, payload);
      } else {
        await api.post('/mesocycles', payload);
      }
      navigate('/mesocycles');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save mesocycle');
    } finally {
      setSaving(false);
    }
  }

  function handleExerciseCreated(newEx) {
    setExercises((prev) => [...prev, newEx]);
  }

  // --- Step 1: Configure ---
  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            {isEdit ? 'Edit Mesocycle' : 'New Mesocycle'}
          </h2>
          <p className="text-gray-500 mt-1">Configure your training block</p>
        </div>

        <div className="card space-y-5">
          <div>
            <label className="label">Mesocycle Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Hypertrophy Block"
            />
          </div>

          <div>
            <label className="label">Duration</label>
            <div className="flex gap-2">
              {[4, 5, 6].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeeks(w)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    weeks === w
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {w} weeks
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Split Type</label>
            <div className="space-y-2">
              {SPLITS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSplit(s.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    splitType === s.id
                      ? 'bg-brand-900/40 border-brand-600 text-gray-100'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <p className="font-semibold text-sm">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Goals, deload plan, etc."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => navigate('/mesocycles')} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => {
                if (!name.trim() || !splitType) {
                  setError('Please fill in name and split type');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="btn-primary flex-1"
            >
              Continue → Build Week
            </button>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    );
  }

  // --- Step 2: Build the week grid ---
  return (
    <div className="flex flex-col -mx-4 md:-mx-6 -my-5 md:-my-8 h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-5rem)]">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
        <button onClick={() => setStep(1)} className="btn-secondary text-xs px-3 shrink-0">
          ← Back
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-100 truncate">{name || 'Untitled'}</h2>
          <p className="text-xs text-gray-500 hidden sm:block">{splitType} · {weeks} weeks — drag exercises from the sidebar</p>
        </div>

        {/* Mobile: toggle exercise library */}
        <button
          onClick={() => setShowSidebar((s) => !s)}
          className="md:hidden btn-secondary text-xs px-3 shrink-0"
        >
          {showSidebar ? 'Hide' : 'Exercises'}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {error && <span className="text-red-400 text-xs hidden sm:inline">{error}</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>

      {/* Mobile: error below top bar */}
      {error && (
        <div className="sm:hidden px-4 py-2 bg-red-900/40 border-b border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Content: sidebar + grid */}
      <div className="flex flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Sidebar: always visible on desktop; toggleable overlay on mobile */}
          <ExerciseSidebar
            exercises={exercises}
            onAddCustom={() => setShowModal(true)}
            className={showSidebar ? 'absolute inset-y-0 left-0 z-10 shadow-2xl' : 'hidden md:flex'}
          />

          {/* Weekly grid */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-5">
            <div className="flex gap-4 min-w-max h-full">
              {weekTemplate.map((day) => (
                <DayColumn
                  key={day.dayIndex}
                  day={day}
                  onRemoveExercise={removeExerciseFromDay}
                  onUpdateExercise={updateExercise}
                  onToggleRest={toggleRestDay}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeExercise ? (
              <div className="px-3 py-2 rounded-lg bg-gray-700 border border-brand-500 text-sm text-gray-100 shadow-xl">
                {activeExercise.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showModal && (
        <AddExerciseModal
          onClose={() => setShowModal(false)}
          onCreated={handleExerciseCreated}
        />
      )}
    </div>
  );
}
