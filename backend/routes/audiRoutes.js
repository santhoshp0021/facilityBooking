const express = require('express');
const router = express.Router();
const AuditoriumRequest = require('../models/AuditoriumRequest');

// API to create a audi booking request
router.post('/audi-request', async (req, res) => {
  try {
    const { userId, date, startTime, endTime, eventName, venue, additionalInfo } = req.body;

    // Basic validation
    if (!userId || !date || !startTime || !endTime || !eventName || !venue ) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
    const booking = {
      userId,
      date,
      startTime,
      endTime,
      eventName,
      venue,
      additionalInfo
    };
    
    await AuditoriumRequest.create(booking);
    res.status(200).json({ message: 'Booking submitted successfully.' });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Get all audi requests by status and userId (for accepted receipts)
router.get('/audi-requests', async (req, res) => {
    const { status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    try {
      const requests = await AuditoriumRequest.find(filter).sort({ bookedAt: -1 });
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Could not fetch audi requests' });
    }
});

// Update status of a audi request
router.post('/audi-requests/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    try {
      await AuditoriumRequest.findByIdAndUpdate(id, { status });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Could not update status' });
    }
});

module.exports = router;