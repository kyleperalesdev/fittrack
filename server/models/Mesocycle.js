import mongoose from 'mongoose';

const setSchemaFields = {
  sets: { type: Number, default: 3 },
  reps: { type: String, default: '8-12' },
  rpe: { type: Number, min: 1, max: 10, default: null },
  notes: { type: String, default: '' },
};

const dayExerciseSchema = new mongoose.Schema(
  {
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    order: { type: Number, default: 0 },
    ...setSchemaFields,
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayIndex: { type: Number, required: true },
    label: { type: String, required: true },
    muscleGroups: [{ type: String }],
    exercises: [dayExerciseSchema],
    isRestDay: { type: Boolean, default: false },
  },
  { _id: false }
);

const mesocycleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    splitType: {
      type: String,
      required: true,
      enum: ['PPL', 'UpperLower', 'FullBody', 'BroSplit', 'Custom'],
    },
    weeks: { type: Number, required: true, min: 4, max: 6 },
    startDate: { type: Date, default: null },
    status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
    weekTemplate: [daySchema],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Mesocycle', mesocycleSchema);
