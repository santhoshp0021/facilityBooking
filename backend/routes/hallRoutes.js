const express = require('express');
const router = express.Router();
const HallRequest = require('../models/HallRequest');

// API to create a hall booking request
router.post('/hall-request', async (req, res) => {
  const { userId, hallName, date, startTime, endTime } = req.body;
  if (!userId || !hallName || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    // Overlap condition: check if any accepted booking for this hall and date overlaps the requested time
    const overlap = await HallRequest.findOne({
      hallName,
      date,
      status: { $in: ['accepted'] },
      $or: [
        // Existing booking starts before new end and ends after new start
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });
    if (overlap) {
      return res.status(409).json({ error: 'Hall already booked for this time slot.' });
    }

    await HallRequest.create({
      userId,
      hallName,
      date,
      startTime,
      endTime
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not create hall request' });
  }
});

// Get all hall requests by status and userId (for accepted receipts)
router.get('/hall-requests', async (req, res) => {
    const { status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    try {
      const requests = await HallRequest.find(filter).sort({ bookedAt: -1 });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Could not fetch hall requests' });
    }
});

// Filter hall requests by hallName and date with improved matching
router.get('/hall-requests/filter', async (req, res) => {
  const { hallName, date } = req.query;
  const filter = {};
  if (hallName) {
    // Case-insensitive, partial match for hall name
    filter.hallName = { $regex: hallName, $options: 'i' };
  }
  if (date) {
    filter.date = date;
  }
  try {
    const requests = await HallRequest.find(filter).sort({ bookedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch filtered hall requests' });
  }
});

// Update status of a hall request
router.post('/hall-requests/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    try {
      await HallRequest.findByIdAndUpdate(id, { status });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Could not update status' });
    }
});
  
module.exports = router;