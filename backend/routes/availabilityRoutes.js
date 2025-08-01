const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Facility } = require('../models/BookingHistory');
const Weektable = require('../models/Weektable');
const {getCurrentWeekStart} = require('../utils');

router.get('/rooms', async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });

  try {
    const weekStart = getCurrentWeekStart();
    const weektables = await Weektable.find({ weekStart });

    const usedRoomNos = new Set();
    for (const wt of weektables) {
      for (const p of wt.periods) {
        if (p.periodId === periodId && p.roomNo) {
          usedRoomNos.add(p.roomNo.trim().toLowerCase());
        }
      }
    }

    const allRooms = await Facility.find({ type: 'room', bookable: true });
    const rooms = allRooms.map(room => ({
      name: room.name,
      type: room.type,
      free: !usedRoomNos.has(room.name.trim().toLowerCase())
    }));

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching rooms', details: err.message });
  }
});

router.get('/labs', async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });

  try {
    const weekStart = getCurrentWeekStart();
    const weektables = await Weektable.find({ weekStart });

    const usedLabs = new Set();
    for (const wt of weektables) {
      for (const p of wt.periods) {
        if (p.periodId === periodId && p.lab) {
          usedLabs.add(p.lab.trim().toLowerCase());
        }
      }
    }

    const allLabs = await Facility.find({ type: 'lab', bookable: true });
    const labs = allLabs.map(lab => ({
      name: lab.name,
      type: lab.type,
      free: !usedLabs.has(lab.name.trim().toLowerCase())
    }));

    res.json(labs);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching labs', details: err.message });
  }
});

router.get('/projectors', async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });

  try {
    const weekStart = getCurrentWeekStart();

    // Fetch all weektable docs for current week
    const weektables = await Weektable.find({ weekStart });

    // Find all projectors used in the given periodId
    const usedProjectorsSet = new Set();
    for (const wt of weektables) {
      for (const p of wt.periods) {
        if (p.periodId === periodId && p.projector?.trim()) {
          usedProjectorsSet.add(p.projector.trim().toLowerCase());
        }
      }
    }

    // Return only the names (and type for consistency)
    const bookedProjectors = Array.from(usedProjectorsSet).map(name => ({
      name,
      type: 'projector'
    }));

    res.json(bookedProjectors);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching projector status', details: err.message });
  }
});

// API to get all periods for the current week for a user
router.get('/weekperiod-details', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    // Find the user by userId string
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({
      userId: user.userId, // string
      weekStart: weekStart
    });

    if (!weektable || !Array.isArray(weektable.periods)) return res.json([]);

    res.json(weektable.periods);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching week periods', details: err.message });
  }
});

// API to get all projector bookings for the current week for a user
router.get('/projector-bookings', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({
      userId: user.userId, // string
      weekStart: weekStart
    });

    if (!weektable || !Array.isArray(weektable.periods)) return res.json([]);

    // Only periods where projector is not empty string
    const projectorPeriods = weektable.periods.filter(period => period.projector && period.projector !== "");

    res.json(projectorPeriods);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching projector bookings', details: err.message });
  }
});
module.exports = router;