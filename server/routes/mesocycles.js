import { Router } from 'express';
import Mesocycle from '../models/Mesocycle.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const mesos = await Mesocycle.find({ user: req.user._id })
      .populate('weekTemplate.exercises.exercise')
      .sort({ createdAt: -1 });
    res.json(mesos);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const meso = await Mesocycle.findOne({ _id: req.params.id, user: req.user._id }).populate(
      'weekTemplate.exercises.exercise'
    );
    if (!meso) return res.status(404).json({ message: 'Mesocycle not found' });
    res.json(meso);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, splitType, weeks, weekTemplate, startDate, notes } = req.body;
    if (!name || !splitType || !weeks) {
      return res.status(400).json({ message: 'Name, split type, and weeks are required' });
    }
    const meso = await Mesocycle.create({
      user: req.user._id,
      name, splitType, weeks,
      weekTemplate: weekTemplate || [],
      startDate: startDate || null,
      notes: notes || '',
    });
    await meso.populate('weekTemplate.exercises.exercise');
    res.status(201).json(meso);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const meso = await Mesocycle.findOne({ _id: req.params.id, user: req.user._id });
    if (!meso) return res.status(404).json({ message: 'Mesocycle not found' });

    const allowed = ['name', 'splitType', 'weeks', 'weekTemplate', 'startDate', 'notes'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) meso[field] = req.body[field];
    });
    if (req.body.status !== undefined) {
      const validStatuses = ['planned', 'active', 'completed'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: 'status must be planned, active, or completed' });
      }
      meso.status = req.body.status;
    }

    await meso.save();
    await meso.populate('weekTemplate.exercises.exercise');
    res.json(meso);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const meso = await Mesocycle.findOne({ _id: req.params.id, user: req.user._id });
    if (!meso) return res.status(404).json({ message: 'Mesocycle not found' });
    await meso.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;
