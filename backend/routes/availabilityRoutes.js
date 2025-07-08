const express = require('express');
const router = express.Router();
const { Booking, Facility } = require('../models/BookingHistory');
const Weektable = require('../models/Weektable');
const {getCurrentWeekStart} = require('../utils');
// List 12 rooms for a period, showing their status from Booking schema
// router.get('/rooms', async (req, res) => {
//   const { periodId } = req.query;
//   if (!periodId) return res.status(400).json({ error: 'periodId required' });

//   try {
//     const booking = await Booking.findOne({ periodId });
//     if (!booking) return res.status(404).json({ error: 'Booking not found' });

//     // Only return rooms (status is global for this periodId)
//     const rooms = booking.facilities.filter(f => f.type === 'room');
//     res.json(rooms);
//   } catch (err) {
//     res.status(500).json({ error: 'Error fetching rooms', details: err.message });
//   }
// });

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

// List 4 labs for a period, showing their status from Booking schema
// router.get('/labs', async (req, res) => {
//   const { periodId } = req.query;
//   if (!periodId) return res.status(400).json({ error: 'periodId required' });

//   try {
//     const booking = await Booking.findOne({ periodId });
//     if (!booking) return res.status(404).json({ error: 'Booking not found' });

//     // Only return labs (status is global for this periodId)
//     const labs = booking.facilities.filter(f => f.type === 'lab');
//     res.json(labs);
//   } catch (err) {
//     res.status(500).json({ error: 'Error fetching labs', details: err.message });
//   }
// });

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


// List all projectors for a period, showing their status from Booking schema
// router.get('/projectors', async (req, res) => {
//   const { periodId } = req.query;
//   if (!periodId) return res.status(400).json({ error: 'periodId required' });

//   try {
//     const booking = await Booking.findOne({ periodId });
//     // If no booking found, show all projectors as free (not booked)
//     if (!booking) return res.json([
//       { name: "Projector1", type: "projector", free: true },
//       { name: "Projector2", type: "projector", free: true },
//       { name: "Projector3", type: "projector", free: true }
//     ]);

//     // Ensure all 3 projectors are always returned, with correct status
//     const projectorNames = ["Projector 1", "Projector 2", "Projector 3"];
//     const projectors = projectorNames.map(name => {
//       // Match ignoring spaces and case
//       const fac = booking.facilities.find(
//         f =>
//           f.type === 'projector' &&
//           f.name &&
//           f.name.replace(/\s+/g, '').toLowerCase() === name.replace(/\s+/g, '').toLowerCase()
//       );
//       return fac
//         ? { name, type: 'projector', free: fac.free }
//         : { name, type: 'projector', free: true };
//     });
//     res.json(projectors);
//   } catch (err) {
//     res.status(500).json({ error: 'Error fetching projectors', details: err.message });
//   }
// });
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
module.exports = router;