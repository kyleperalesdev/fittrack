import mongoose from 'mongoose';

const setLogSchema = new mongoose.Schema(
  {
    weight: { type: Number, default: null },
    reps: { type: Number, default: null },
    rpe: { type: Number, min: 1, max: 10, default: null },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const exerciseLogSchema = new mongoose.Schema(
  {
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: [setLogSchema],
    feeling: {
      type: String,
      enum: ['easy', 'good', 'hard', 'fail'],
      default: null,
    },
  },
  { _id: false }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mesocycle: { type: mongoose.Schema.Types.ObjectId, ref: 'Mesocycle', required: true },
    week: { type: Number, required: true, min: 1 },
    dayIndex: { type: Number, required: true, min: 0, max: 6 },
    date: { type: Date, default: Date.now },
    exercises: [exerciseLogSchema],
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

workoutSessionSchema.index({ user: 1, mesocycle: 1, week: 1, dayIndex: 1 }, { unique: true });

export default mongoose.model('WorkoutSession', workoutSessionSchema);
