import dotenv from 'dotenv';
import mongoose from 'mongoose';
import InviteCode from './models/InviteCode.js';
import Exercise from './models/Exercise.js';

dotenv.config();

const exercises = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Incline Barbell Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Cable Fly', muscleGroup: 'chest', equipment: 'cable' },
  { name: 'Pec Deck', muscleGroup: 'chest', equipment: 'machine' },
  { name: 'Dips (Chest)', muscleGroup: 'chest', equipment: 'bodyweight' },
  { name: 'Push-Up', muscleGroup: 'chest', equipment: 'bodyweight' },

  // Back
  { name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Pull-Up', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Single-Arm Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell' },
  { name: 'T-Bar Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Face Pull', muscleGroup: 'back', equipment: 'cable' },

  // Shoulders
  { name: 'Overhead Press (Barbell)', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Cable Lateral Raise', muscleGroup: 'shoulders', equipment: 'cable' },
  { name: 'Rear Delt Fly', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Arnold Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Front Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },

  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell' },
  { name: 'Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Cable Curl', muscleGroup: 'biceps', equipment: 'cable' },
  { name: 'Preacher Curl', muscleGroup: 'biceps', equipment: 'machine' },
  { name: 'Chin-Up', muscleGroup: 'biceps', equipment: 'bodyweight' },

  // Triceps
  { name: 'Close-Grip Bench Press', muscleGroup: 'triceps', equipment: 'barbell' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'triceps', equipment: 'dumbbell' },
  { name: 'Cable Tricep Pushdown', muscleGroup: 'triceps', equipment: 'cable' },
  { name: 'Skull Crushers', muscleGroup: 'triceps', equipment: 'barbell' },
  { name: 'Tricep Dips', muscleGroup: 'triceps', equipment: 'bodyweight' },
  { name: 'Diamond Push-Up', muscleGroup: 'triceps', equipment: 'bodyweight' },
  { name: 'Kickback', muscleGroup: 'triceps', equipment: 'dumbbell' },

  // Legs
  { name: 'Barbell Back Squat', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Front Squat', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Leg Press', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Hack Squat', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Leg Extension', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Leg Curl (Lying)', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Walking Lunge', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Calf Raise (Standing)', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Calf Raise (Seated)', muscleGroup: 'legs', equipment: 'machine' },

  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'glutes', equipment: 'barbell' },
  { name: 'Cable Kickback', muscleGroup: 'glutes', equipment: 'cable' },
  { name: 'Sumo Deadlift', muscleGroup: 'glutes', equipment: 'barbell' },
  { name: 'Glute Bridge', muscleGroup: 'glutes', equipment: 'bodyweight' },
  { name: 'Step-Up', muscleGroup: 'glutes', equipment: 'dumbbell' },

  // Core
  { name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Cable Crunch', muscleGroup: 'core', equipment: 'cable' },
  { name: 'Hanging Leg Raise', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'core', equipment: 'other' },
  { name: 'Russian Twist', muscleGroup: 'core', equipment: 'dumbbell' },
  { name: 'Side Plank', muscleGroup: 'core', equipment: 'bodyweight' },

  // Full Body
  { name: 'Power Clean', muscleGroup: 'full_body', equipment: 'barbell' },
  { name: 'Kettlebell Swing', muscleGroup: 'full_body', equipment: 'kettlebell' },
  { name: 'Burpee', muscleGroup: 'full_body', equipment: 'bodyweight' },
  { name: 'Thruster', muscleGroup: 'full_body', equipment: 'barbell' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Seed invite code
  const code = process.env.INVITE_CODE || 'FITNESS2024';
  await InviteCode.findOneAndUpdate(
    { code },
    { code, maxUses: 10 },
    { upsert: true, new: true }
  );
  console.log(`Invite code seeded: ${code}`);

  // Seed exercises (skip existing)
  let added = 0;
  for (const ex of exercises) {
    const exists = await Exercise.findOne({ name: ex.name, isCustom: false });
    if (!exists) {
      await Exercise.create({ ...ex, isCustom: false });
      added++;
    }
  }
  console.log(`Exercises seeded: ${added} new, ${exercises.length - added} already existed`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
