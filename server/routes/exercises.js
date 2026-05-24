import { Router } from 'express';
import Exercise from '../models/Exercise.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const exercises = await Exercise.find({
      $or: [{ isCustom: false }, { createdBy: req.user._id }],
    }).sort({ muscleGroup: 1, name: 1 });
    res.json(exercises);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, muscleGroup, equipment } = req.body;
    if (!name || !muscleGroup) {
      return res.status(400).json({ message: 'Name and muscle group are required' });
    }
    const exercise = await Exercise.create({
      name, muscleGroup, equipment,
      isCustom: true,
      createdBy: req.user._id,
    });
    res.status(201).json(exercise);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const exercise = await Exercise.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    await exercise.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
