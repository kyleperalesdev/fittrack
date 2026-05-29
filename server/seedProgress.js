import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Exercise from './models/Exercise.js';
import Mesocycle from './models/Mesocycle.js';
import WorkoutSession from './models/WorkoutSession.js';

dotenv.config();

// ─── Template definitions ─────────────────────────────────────────────────────

const UPPER_A = [
  { name: 'Barbell Bench Press',      sets: 4, reps: '8-10',  rpe: 8 },
  { name: 'Barbell Row',              sets: 4, reps: '8-10',  rpe: 8 },
  { name: 'Overhead Press (Barbell)', sets: 3, reps: '10-12', rpe: 7 },
  { name: 'Lat Pulldown',             sets: 3, reps: '10-12', rpe: 7 },
  { name: 'Barbell Curl',             sets: 3, reps: '12-15', rpe: 7 },
  { name: 'Cable Tricep Pushdown',    sets: 3, reps: '12-15', rpe: 7 },
];

const LOWER_A = [
  { name: 'Barbell Back Squat',    sets: 4, reps: '6-8',   rpe: 8 },
  { name: 'Romanian Deadlift',     sets: 3, reps: '10-12', rpe: 7 },
  { name: 'Leg Press',             sets: 3, reps: '12-15', rpe: 7 },
  { name: 'Hip Thrust',            sets: 3, reps: '10-12', rpe: 7 },
  { name: 'Calf Raise (Standing)', sets: 3, reps: '15-20', rpe: 6 },
];

const UPPER_B = [
  { name: 'Incline Barbell Press',    sets: 4, reps: '8-10',  rpe: 8 },
  { name: 'Pull-Up',                  sets: 4, reps: '6-8',   rpe: 8 },
  { name: 'Dumbbell Shoulder Press',  sets: 3, reps: '10-12', rpe: 7 },
  { name: 'Seated Cable Row',         sets: 3, reps: '10-12', rpe: 7 },
  { name: 'Hammer Curl',              sets: 3, reps: '12-15', rpe: 7 },
  { name: 'Skull Crushers',           sets: 3, reps: '10-12', rpe: 7 },
];

const LOWER_B = [
  { name: 'Deadlift',              sets: 4, reps: '5-6',   rpe: 8 },
  { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12', rpe: 8 },
  { name: 'Leg Curl (Lying)',      sets: 3, reps: '12-15', rpe: 7 },
  { name: 'Cable Kickback',        sets: 3, reps: '12-15', rpe: 6 },
  { name: 'Calf Raise (Seated)',   sets: 3, reps: '15-20', rpe: 6 },
];

// Base weight (kg) at week 1, and increment per week
const WEIGHT_CONFIG = {
  'Barbell Bench Press':      { base: 80,  inc: 2.5 },
  'Barbell Row':              { base: 75,  inc: 2.5 },
  'Overhead Press (Barbell)': { base: 55,  inc: 2.5 },
  'Lat Pulldown':             { base: 65,  inc: 2.5 },
  'Barbell Curl':             { base: 45,  inc: 2.5 },
  'Cable Tricep Pushdown':    { base: 40,  inc: 2.5 },
  'Barbell Back Squat':       { base: 100, inc: 2.5 },
  'Romanian Deadlift':        { base: 80,  inc: 2.5 },
  'Leg Press':                { base: 150, inc: 5   },
  'Hip Thrust':               { base: 90,  inc: 5   },
  'Calf Raise (Standing)':    { base: 60,  inc: 2.5 },
  'Incline Barbell Press':    { base: 70,  inc: 2.5 },
  'Pull-Up':                  { base: null, inc: 0  }, // bodyweight
  'Dumbbell Shoulder Press':  { base: 26,  inc: 2   },
  'Seated Cable Row':         { base: 65,  inc: 2.5 },
  'Hammer Curl':              { base: 20,  inc: 2   },
  'Skull Crushers':           { base: 40,  inc: 2.5 },
  'Deadlift':                 { base: 120, inc: 5   },
  'Bulgarian Split Squat':    { base: 22,  inc: 2   },
  'Leg Curl (Lying)':         { base: 55,  inc: 2.5 },
  'Cable Kickback':           { base: 20,  inc: 2   },
  'Calf Raise (Seated)':      { base: 50,  inc: 2.5 },
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeight(name, week) {
  const cfg = WEIGHT_CONFIG[name];
  if (!cfg || cfg.base === null) return null;
  return cfg.base + cfg.inc * (week - 1);
}

function midReps(repsStr) {
  const [lo, hi] = repsStr.split('-').map(Number);
  return hi ? Math.round((lo + hi) / 2) : lo;
}

function buildSets(template, name, week, { partialFrom } = {}) {
  return Array.from({ length: template.sets }, (_, i) => {
    const done = partialFrom === undefined || i < partialFrom;
    return {
      weight: getWeight(name, week),
      reps: done ? midReps(template.reps) : null,
      rpe: done ? Math.min(10, template.rpe + (week - 1) * 0.5) : null,
      completed: done,
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Resolve user — accept email as first CLI arg, else use first user in DB
  const emailArg = process.argv[2];
  const user = emailArg
    ? await User.findOne({ email: emailArg.toLowerCase() })
    : await User.findOne({});

  if (!user) {
    console.error('No user found. Register an account first.');
    process.exit(1);
  }
  console.log(`Seeding for: ${user.name} <${user.email}>`);

  // Resolve exercise documents
  const allNames = [...UPPER_A, ...LOWER_A, ...UPPER_B, ...LOWER_B].map((e) => e.name);
  const docs = await Exercise.find({ name: { $in: allNames } });
  const byName = new Map(docs.map((d) => [d.name, d]));

  const missing = allNames.filter((n) => !byName.has(n));
  if (missing.length) {
    console.error('Missing exercises — run `npm run seed` first:', missing);
    process.exit(1);
  }

  const eid = (name) => byName.get(name)._id;

  // ─── Build mesocycle ───────────────────────────────────────────────────────

  // Start date: Monday May 5 2026 — puts today (Thu May 29) in week 4
  const startDate = new Date('2026-05-05T00:00:00.000Z');

  // Clean up any existing seed data for this user
  const existing = await Mesocycle.findOne({ user: user._id, name: '4-Week Upper/Lower Block' });
  if (existing) {
    await WorkoutSession.deleteMany({ mesocycle: existing._id });
    await Mesocycle.deleteOne({ _id: existing._id });
    console.log('Removed previous seed data');
  }

  function templateDay(dayIndex, label, muscleGroups, list, isRest = false) {
    return {
      dayIndex, label, muscleGroups, isRestDay: isRest,
      exercises: isRest ? [] : list.map((e, i) => ({
        exercise: eid(e.name),
        order: i,
        sets: e.sets,
        reps: e.reps,
        rpe: e.rpe,
      })),
    };
  }

  const meso = await Mesocycle.create({
    user: user._id,
    name: '4-Week Upper/Lower Block',
    splitType: 'UpperLower',
    weeks: 4,
    startDate,
    status: 'active',
    notes: 'Hypertrophy focus. +2.5 kg/week on compounds, +2 kg/week on isolations.',
    weekTemplate: [
      templateDay(0, 'Upper A', ['chest', 'back', 'shoulders', 'biceps', 'triceps'], UPPER_A),
      templateDay(1, 'Lower A', ['legs', 'glutes'], LOWER_A),
      templateDay(2, 'Rest',    [], [], true),
      templateDay(3, 'Upper B', ['chest', 'back', 'shoulders', 'biceps', 'triceps'], UPPER_B),
      templateDay(4, 'Lower B', ['legs', 'glutes'], LOWER_B),
      templateDay(5, 'Rest',    [], [], true),
      templateDay(6, 'Rest',    [], [], true),
    ],
  });
  console.log(`Created mesocycle: "${meso.name}" (${meso._id})`);

  // ─── Build sessions ────────────────────────────────────────────────────────
  // Schedule:
  //   Weeks 1–3:  Mon (0) Upper A, Tue (1) Lower A, Thu (3) Upper B, Fri (4) Lower B — all completed
  //   Week 4 Mon (0): Upper A — completed
  //   Week 4 Tue (1): Lower A — completed
  //   Week 4 Thu (3): Upper B — IN PROGRESS (today, May 29)
  //   Week 4 Fri (4): Lower B — skipped (tomorrow)

  const TRAINING = [
    { dayIndex: 0, list: UPPER_A },
    { dayIndex: 1, list: LOWER_A },
    { dayIndex: 3, list: UPPER_B },
    { dayIndex: 4, list: LOWER_B },
  ];

  // sessionDate: startDate + (week-1)*7 days + dayIndex days
  function sessionDate(week, dayIndex) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + (week - 1) * 7 + dayIndex);
    return d;
  }

  let count = 0;

  for (let week = 1; week <= 4; week++) {
    for (const { dayIndex, list } of TRAINING) {
      const isToday = week === 4 && dayIndex === 3;    // Thu May 29 — in progress
      const isFuture = week === 4 && dayIndex === 4;   // Fri May 30 — skip
      if (isFuture) continue;

      const exercises = list.map((tmpl) => ({
        exercise: eid(tmpl.name),
        sets: buildSets(tmpl, tmpl.name, week, isToday ? { partialFrom: 2 } : {}),
      }));

      await WorkoutSession.create({
        user: user._id,
        mesocycle: meso._id,
        week,
        dayIndex,
        date: sessionDate(week, dayIndex),
        exercises,
        completed: !isToday,
      });

      const tag = isToday ? '⏸  in progress' : '✓  completed';
      console.log(`  Week ${week}  ${DAY_NAMES[dayIndex]}  ${tag}`);
      count++;
    }
  }

  console.log(`\nSeeded ${count} sessions. Week 4 Fri (Lower B) left unstarted as future day.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
