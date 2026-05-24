import mongoose from 'mongoose';

const inviteCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxUses: { type: Number, default: 10 },
  },
  { timestamps: true }
);

inviteCodeSchema.virtual('isValid').get(function () {
  return this.usedBy.length < this.maxUses;
});

export default mongoose.model('InviteCode', inviteCodeSchema);
