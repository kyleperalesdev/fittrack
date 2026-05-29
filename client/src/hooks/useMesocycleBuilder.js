import { useState, useCallback } from 'react';

const SPLIT_TEMPLATES = {
  PPL: [
    { dayIndex: 0, label: 'Push', muscleGroups: ['chest', 'shoulders', 'triceps'], isRestDay: false },
    { dayIndex: 1, label: 'Pull', muscleGroups: ['back', 'biceps'], isRestDay: false },
    { dayIndex: 2, label: 'Legs', muscleGroups: ['legs', 'glutes'], isRestDay: false },
    { dayIndex: 3, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 4, label: 'Push', muscleGroups: ['chest', 'shoulders', 'triceps'], isRestDay: false },
    { dayIndex: 5, label: 'Pull', muscleGroups: ['back', 'biceps'], isRestDay: false },
    { dayIndex: 6, label: 'Legs', muscleGroups: ['legs', 'glutes'], isRestDay: false },
  ],
  UpperLower: [
    { dayIndex: 0, label: 'Upper', muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'], isRestDay: false },
    { dayIndex: 1, label: 'Lower', muscleGroups: ['legs', 'glutes'], isRestDay: false },
    { dayIndex: 2, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 3, label: 'Upper', muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'], isRestDay: false },
    { dayIndex: 4, label: 'Lower', muscleGroups: ['legs', 'glutes'], isRestDay: false },
    { dayIndex: 5, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 6, label: 'Rest', muscleGroups: [], isRestDay: true },
  ],
  FullBody: [
    { dayIndex: 0, label: 'Full Body', muscleGroups: ['full_body'], isRestDay: false },
    { dayIndex: 1, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 2, label: 'Full Body', muscleGroups: ['full_body'], isRestDay: false },
    { dayIndex: 3, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 4, label: 'Full Body', muscleGroups: ['full_body'], isRestDay: false },
    { dayIndex: 5, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 6, label: 'Rest', muscleGroups: [], isRestDay: true },
  ],
  BroSplit: [
    { dayIndex: 0, label: 'Chest', muscleGroups: ['chest'], isRestDay: false },
    { dayIndex: 1, label: 'Back', muscleGroups: ['back'], isRestDay: false },
    { dayIndex: 2, label: 'Shoulders', muscleGroups: ['shoulders'], isRestDay: false },
    { dayIndex: 3, label: 'Arms', muscleGroups: ['biceps', 'triceps'], isRestDay: false },
    { dayIndex: 4, label: 'Legs', muscleGroups: ['legs', 'glutes'], isRestDay: false },
    { dayIndex: 5, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 6, label: 'Rest', muscleGroups: [], isRestDay: true },
  ],
  Custom: [
    { dayIndex: 0, label: 'Day 1', muscleGroups: [], isRestDay: false },
    { dayIndex: 1, label: 'Day 2', muscleGroups: [], isRestDay: false },
    { dayIndex: 2, label: 'Day 3', muscleGroups: [], isRestDay: false },
    { dayIndex: 3, label: 'Rest', muscleGroups: [], isRestDay: true },
    { dayIndex: 4, label: 'Day 4', muscleGroups: [], isRestDay: false },
    { dayIndex: 5, label: 'Day 5', muscleGroups: [], isRestDay: false },
    { dayIndex: 6, label: 'Rest', muscleGroups: [], isRestDay: true },
  ],
};

function templateWithExercises(template) {
  return template.map((day) => ({ ...day, exercises: [] }));
}

export function useMesocycleBuilder(initial = null) {
  const [name, setName] = useState(initial?.name ?? '');
  const [splitType, setSplitType] = useState(initial?.splitType ?? null);
  const [weeks, setWeeks] = useState(initial?.weeks ?? 4);
  const [weekTemplate, setWeekTemplate] = useState(
    initial?.weekTemplate ?? []
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const selectSplit = useCallback((type) => {
    setSplitType(type);
    setWeekTemplate(templateWithExercises(SPLIT_TEMPLATES[type]));
  }, []);

  const addExerciseToDay = useCallback((dayIndex, exercise) => {
    setWeekTemplate((prev) =>
      prev.map((day) =>
        day.dayIndex === dayIndex
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  exercise,
                  sets: 3,
                  reps: '8-12',
                  rpe: null,
                  notes: '',
                  order: day.exercises.length,
                  _clientId: crypto.randomUUID(),
                },
              ],
            }
          : day
      )
    );
  }, []);

  const removeExerciseFromDay = useCallback((dayIndex, exerciseIdx) => {
    setWeekTemplate((prev) =>
      prev.map((day) =>
        day.dayIndex === dayIndex
          ? { ...day, exercises: day.exercises.filter((_, i) => i !== exerciseIdx) }
          : day
      )
    );
  }, []);

  const updateExercise = useCallback((dayIndex, exerciseIdx, patch) => {
    setWeekTemplate((prev) =>
      prev.map((day) =>
        day.dayIndex === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((ex, i) => (i === exerciseIdx ? { ...ex, ...patch } : ex)),
            }
          : day
      )
    );
  }, []);

  const reorderExercises = useCallback((dayIndex, newOrder) => {
    setWeekTemplate((prev) =>
      prev.map((day) => (day.dayIndex === dayIndex ? { ...day, exercises: newOrder } : day))
    );
  }, []);

  const toggleRestDay = useCallback((dayIndex) => {
    setWeekTemplate((prev) =>
      prev.map((day) =>
        day.dayIndex === dayIndex
          ? { ...day, isRestDay: !day.isRestDay, exercises: day.isRestDay ? day.exercises : [] }
          : day
      )
    );
  }, []);

  const toPayload = useCallback(() => ({
    name,
    splitType,
    weeks,
    notes,
    weekTemplate: weekTemplate.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex, i) => ({
        exercise: ex.exercise._id ?? ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        rpe: ex.rpe,
        notes: ex.notes,
        order: i,
        // _clientId is client-only — intentionally excluded from server payload
      })),
    })),
  }), [name, splitType, weeks, notes, weekTemplate]);

  return {
    name, setName,
    splitType, setSplitType, selectSplit,
    weeks, setWeeks,
    weekTemplate, setWeekTemplate,
    notes, setNotes,
    addExerciseToDay,
    removeExerciseFromDay,
    updateExercise,
    reorderExercises,
    toggleRestDay,
    toPayload,
  };
}

export { SPLIT_TEMPLATES };
