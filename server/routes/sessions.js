import { Router } from 'express';
import WorkoutSession from '../models/WorkoutSession.js';
import Mesocycle from '../models/Mesocycle.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { mesocycleId } = req.query;
    if (!mesocycleId) {
      return res.status(400).json({ message: 'mesocycleId query param required' });
    }
    const meso = await Mesocycle.findOne({ _id: mesocycleId, user: req.user._id });
    if (!meso) return res.status(404).json({ message: 'Mesocycle not found' });

    const sessions = await WorkoutSession.find({ mesocycle: mesocycleId, user: req.user._id })
      .populate('exercises.exercise')
      .sort({ week: 1, dayIndex: 1 });
    res.json(sessions);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { mesocycle, week, dayIndex, exercises, completed } = req.body;
    if (!mesocycle || week == null || dayIndex == null) {
      return res.status(400).json({ message: 'mesocycle, week, and dayIndex are required' });
    }
    const meso = await Mesocycle.findOne({ _id: mesocycle, user: req.user._id });
    if (!meso) return res.status(404).json({ message: 'Mesocycle not found' });

    const session = await WorkoutSession.create({
      user: req.user._id,
      mesocycle,
      week,
      dayIndex,
      exercises: exercises ?? [],
      completed: completed ?? false,
    });
    await session.populate('exercises.exercise');
    res.status(201).json(session);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const { exercises, completed } = req.body;
    if (exercises !== undefined) session.exercises = exercises;
    if (completed !== undefined) session.completed = completed;

    await session.save();
    await session.populate('exercises.exercise');
    res.json(session);
  } catch (err) { next(err); }
});

export default router;
