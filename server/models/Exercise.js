import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    muscleGroup: {
      type: String,
      required: true,
      enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'full_body'],
    },
    equipment: {
      type: String,
      enum: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'other'],
      default: 'other',
    },
    isCustom: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Exercise', exerciseSchema);
