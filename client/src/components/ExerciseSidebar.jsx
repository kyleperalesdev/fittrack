import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';

const MUSCLE_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  full_body: 'Full Body',
};

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

function DraggableExercise({ exercise }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `exercise-${exercise._id}`,
    data: { exercise },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 cursor-grab text-sm select-none transition-opacity ${
        isDragging ? 'opacity-30' : 'hover:border-gray-500'
      }`}
    >
      <span className={`text-xs font-bold ${MUSCLE_COLORS[exercise.muscleGroup]}`}>
        {exercise.muscleGroup.replace('_', ' ').toUpperCase().slice(0, 3)}
      </span>
      <span className="text-gray-200 truncate">{exercise.name}</span>
    </div>
  );
}

export default function ExerciseSidebar({ exercises, onAddCustom, className = '' }) {
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchGroup = filterGroup === 'all' || ex.muscleGroup === filterGroup;
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [exercises, search, filterGroup]);

  const groups = useMemo(() => {
    const seen = new Set();
    exercises.forEach((ex) => seen.add(ex.muscleGroup));
    return Array.from(seen).sort();
  }, [exercises]);

  return (
    <div className={`flex flex-col h-full bg-gray-900 border-r border-gray-800 w-64 shrink-0 ${className}`}>
      <div className="p-4 border-b border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Exercise Library
        </p>
        <input
          className="input mb-2"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input text-xs"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        >
          <option value="all">All muscle groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {MUSCLE_LABELS[g] || g}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No exercises found</p>
        ) : (
          filtered.map((ex) => <DraggableExercise key={ex._id} exercise={ex} />)
        )}
      </div>

      <div className="p-3 border-t border-gray-800">
        <button onClick={onAddCustom} className="btn-secondary w-full text-xs">
          + Add Custom Exercise
        </button>
      </div>
    </div>
  );
}
