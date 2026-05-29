import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MUSCLE_COLORS = {
  chest: 'bg-red-900/30 border-red-800',
  back: 'bg-orange-900/30 border-orange-800',
  shoulders: 'bg-yellow-900/30 border-yellow-800',
  biceps: 'bg-green-900/30 border-green-800',
  triceps: 'bg-teal-900/30 border-teal-800',
  legs: 'bg-blue-900/30 border-blue-800',
  glutes: 'bg-purple-900/30 border-purple-800',
  core: 'bg-pink-900/30 border-pink-800',
  full_body: 'bg-gray-800/50 border-gray-700',
};

function SortableExercise({ id, exercise, dayIndex, exIdx, onRemove, onUpdate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { dayIndex } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const exData = exercise.exercise ?? exercise;
  const colorClass = MUSCLE_COLORS[exData.muscleGroup] ?? 'bg-gray-800/50 border-gray-700';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-2 text-xs ${colorClass}`}
    >
      <div className="flex items-center gap-1 mb-1">
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab text-gray-500 hover:text-gray-300 px-0.5 touch-none"
          title="Drag to reorder"
        >
          ⠿
        </button>
        <span className="font-semibold text-gray-200 flex-1 truncate">{exData.name}</span>
        <button
          onClick={() => onRemove(dayIndex, exIdx)}
          className="text-gray-600 hover:text-red-400 ml-1"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <input
          type="number"
          min="1"
          max="20"
          value={exercise.sets}
          onChange={(e) => onUpdate(dayIndex, exIdx, { sets: Number(e.target.value) })}
          className="w-10 bg-gray-900/60 border border-gray-700 rounded px-1 py-0.5 text-center text-xs"
          title="Sets"
        />
        <span className="text-gray-600">×</span>
        <input
          type="text"
          value={exercise.reps}
          onChange={(e) => onUpdate(dayIndex, exIdx, { reps: e.target.value })}
          className="w-14 bg-gray-900/60 border border-gray-700 rounded px-1 py-0.5 text-center text-xs"
          placeholder="reps"
          title="Reps"
        />
        <span className="text-gray-600 ml-1">RPE</span>
        <input
          type="number"
          min="1"
          max="10"
          value={exercise.rpe ?? ''}
          onChange={(e) => onUpdate(dayIndex, exIdx, { rpe: e.target.value ? Number(e.target.value) : null })}
          className="w-10 bg-gray-900/60 border border-gray-700 rounded px-1 py-0.5 text-center text-xs"
          placeholder="—"
          title="RPE"
        />
      </div>
    </div>
  );
}

export default function DayColumn({ day, onRemoveExercise, onUpdateExercise, onToggleRest }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.dayIndex}`, disabled: day.isRestDay });
  const [confirmRest, setConfirmRest] = useState(false);

  const sortableIds = day.exercises.map((ex) => ex._clientId);

  function handleToggleRest() {
    // Only confirm when switching a day that has exercises to rest
    if (!day.isRestDay && day.exercises.length > 0) {
      setConfirmRest(true);
    } else {
      onToggleRest(day.dayIndex);
    }
  }

  function confirmToRest() {
    onToggleRest(day.dayIndex);
    setConfirmRest(false);
  }

  return (
    <div className="flex flex-col min-w-[220px] max-w-[280px] w-full">
      {/* Day header */}
      <div className="flex items-center justify-between mb-2 min-h-[36px]">
        <div>
          <span className="text-xs text-gray-500">{DAY_NAMES[day.dayIndex]}</span>
          <p className="font-semibold text-sm text-gray-200 leading-tight">{day.label}</p>
        </div>

        {confirmRest ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">Clear {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}?</span>
            <button
              onClick={confirmToRest}
              className="font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmRest(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggleRest}
            title={day.isRestDay ? 'Mark as training day' : 'Mark as rest day'}
            className="text-xs text-gray-600 hover:text-gray-400 px-1 transition-colors"
          >
            {day.isRestDay ? '▶' : '⏸'}
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl border-2 border-dashed p-2 space-y-2 transition-colors ${
          day.isRestDay
            ? 'border-gray-800 bg-gray-900/30 pointer-events-none'
            : isOver
            ? 'border-brand-500 bg-brand-900/20'
            : 'border-gray-700 bg-gray-900/40'
        }`}
      >
        {day.isRestDay ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-gray-600">Rest Day</span>
          </div>
        ) : day.exercises.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-gray-600">Drop exercises here</span>
          </div>
        ) : (
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {day.exercises.map((ex, i) => (
              <SortableExercise
                key={ex._clientId}
                id={ex._clientId}
                exercise={ex}
                dayIndex={day.dayIndex}
                exIdx={i}
                onRemove={onRemoveExercise}
                onUpdate={onUpdateExercise}
              />
            ))}
          </SortableContext>
        )}
      </div>

      {/* Exercise count badge */}
      {!day.isRestDay && (
        <div className="mt-1 text-center text-xs text-gray-600">
          {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
