const express = require('express');
const router = express.Router();
const { getCurrentWeekStart} = require('../utils');
const User =  require('../models/User');
const Weektable =  require('../models/Weektable');
const { Booking, BookingHistory } = require('../models/BookingHistory');

// Book a projector for a period (update both Booking and Weektable for the booking user only)
router.post('/book-projector', async (req, res) => {
    const { userId, periodId, projectorName } = req.body;
    // If any required field is missing or empty, return 400
    if (!userId || !periodId || !projectorName || typeof projectorName !== 'string' || !projectorName.trim()) {
      return res.status(400).json({ error: 'userId, periodId, and projectorName required' });
    }
    try {
      // Update the projector's free status in Booking (global for the period)
      const booking = await Booking.findOne({ periodId });
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
  
      // Normalize projector name for robust matching
      const projector = booking.facilities.find(
        f =>
          f.type === 'projector' &&
          f.name.replace(/\s+/g, '').toLowerCase() === projectorName.replace(/\s+/g, '').toLowerCase()
      );
      if (!projector) return res.status(404).json({ error: 'Projector not found' });
      if (!projector.free) return res.status(400).json({ error: 'Projector already booked' });
  
      projector.free = false;
      projector.bookedBy = userId; // Store who booked it
      await booking.save();
  
      // Insert into booking history
      const userObj = await User.findOne({ userId });
      await BookingHistory.create({
        userId: userObj._id,
        periodId,
        facility: { name: projectorName, type: 'projector', free: false }
      });
      // Update the period in Weektable for ONLY the booking user
      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const weekStart = getCurrentWeekStart();
      const weektable = await Weektable.findOne({ userId: user.userId, weekStart });
      if (!weektable) return res.status(404).json({ error: 'Weektable not found' });
      const period = weektable.periods.find(p =>p.periodId === periodId);
      if (!period) return res.status(404).json({ error: 'Period not found in weektable' });
      period.projector = projectorName; // <-- store projector name
      await weektable.save();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error booking projector', details: err.message });
    }
});
  
// Book a room for a period (update both Booking and Weektable for the booking user only)
router.post('/book-room', async (req, res) => {
    const { userId, periodId, roomName, staffName, courseCode } = req.body;
    if (!userId || !periodId || !roomName) {
      return res.status(400).json({ error: 'userId, periodId, and roomName required' });
    }
    try {
      // Update the room's free status in Booking (global for the period)
      const booking = await Booking.findOne({ periodId });
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
  
      const room = booking.facilities.find(f => f.name === roomName && f.type === 'room');
      if (!room) return res.status(404).json({ error: 'Room not found' });
      if (!room.free) return res.status(400).json({ error: 'Room already booked' });
  
      room.free = false;
      room.bookedBy =userId;
      await booking.save();
  
      // Insert into booking history
      const userObj = await User.findOne({ userId });
      await BookingHistory.create({
        userId: userObj._id,
        periodId,
        facility: { name: roomName, type: 'room', free: false }
      });
  
      // Update the period in Weektable for ONLY the booking user
      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const weekStart = getCurrentWeekStart();
      const weektable = await Weektable.findOne({ userId: user.userId, weekStart });
      if (!weektable) return res.status(404).json({ error: 'Weektable not found' });
  
      const period = weektable.periods.find(p => p.periodId === periodId);
      if (!period) return res.status(404).json({ error: 'Period not found in weektable' });
  
      period.free = false;
      period.roomNo = roomName;
      period.staffName = staffName || '';
      period.courseCode = courseCode || '';
  
      await weektable.save();
  
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error booking room', details: err.message });
    }
});
  
// Book a lab for a period (update both Booking and Weektable for the booking user only)
router.post('/book-lab', async (req, res) => {
    const { userId, periodId, labName, staffName, courseCode } = req.body;
    if (!userId || !periodId || !labName) {
      return res.status(400).json({ error: 'userId, periodId, and labName required' });
    }
    try {
      // Update the lab's free status in Booking (global for the period)
      const booking = await Booking.findOne({ periodId });
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
  
      const lab = booking.facilities.find(f => f.name === labName && f.type === 'lab');
      if (!lab) return res.status(404).json({ error: 'Lab not found' });
      if (!lab.free) return res.status(400).json({ error: 'Lab already booked' });
  
      lab.free = false;
      lab.bookedBy=userId;
      await booking.save();
  
      // Insert into booking history
      const userObj = await User.findOne({ userId });
      await BookingHistory.create({
        userId: userObj._id,
        periodId,
        facility: { name: labName, type: 'lab', free: false }
      });
  
      // Update the period in Weektable for ONLY the booking user
      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const weekStart = getCurrentWeekStart();
      const weektable = await Weektable.findOne({ userId: user.userId, weekStart });
      if (!weektable) return res.status(404).json({ error: 'Weektable not found' });
  
      const period = weektable.periods.find(p => p.periodId === periodId);
      if (!period) return res.status(404).json({ error: 'Period not found in weektable' });
  
      period.free = false;
      period.lab = labName;
      period.staffName = staffName || '';
      period.courseCode = courseCode || '';
  
      await weektable.save();
  
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error booking lab', details: err.message });
    }
});

// Free a period: update weektable for the user and booking facilities for the period
router.post('/free-period/:periodId', async (req, res) => {
  const { periodId } = req.params;
  const { userId } = req.body;
  if (!userId || !periodId) return res.status(400).json({ error: 'userId and periodId required' });

  try {
    // Update the user's weektable for this period
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId: user.userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });

    const period = weektable.periods.find(p => p.periodId === periodId);
    if (!period) return res.status(404).json({ error: 'Period not found in weektable' });

    // --- Only free facilities that are associated with this user's period ---
    const facilitiesToFree = [];
    if (period.roomNo && period.roomNo.trim()) facilitiesToFree.push({ type: 'room', name: period.roomNo });
    if (period.projector && period.projector.trim()) facilitiesToFree.push({ type: 'projector', name: period.projector });
    if (period.lab && period.lab.trim()) facilitiesToFree.push({ type: 'lab', name: period.lab });

    // Update only those facilities in Booking
    const booking = await Booking.findOne({ periodId });
    if (booking) {
      facilitiesToFree.forEach(async facToFree => {
        const fac = booking.facilities.find(
          f =>
            f.type === facToFree.type &&
            f.name &&
            f.name.replace(/\s+/g, '').toLowerCase() === facToFree.name.replace(/\s+/g, '').toLowerCase()
        );
        if (fac) {
          fac.free = true;
          fac.bookedBy = ''; 
          // Insert into booking history for freeing
          const userObj = await User.findOne({ userId });
          await BookingHistory.create({
            userId: userObj._id,
            periodId,
            facility: { name: fac.name, type: fac.type, free: true }
          });
        }
      });
      await booking.save();
    }

    // Now clear the user's weektable period fields
    period.free = true;
    period.staffName = '';
    period.courseCode = '';
    period.roomNo = '';
    period.lab = '';
    period.projector = ""; // <-- set to empty string

    await weektable.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error freeing period' });
  }
});

// (Dashboard) Get booking for a given periodId 
router.get('/booking', async (req, res) => {
  const { periodId } = req.query;
  if (!periodId) return res.status(400).json({ error: 'periodId required' });
  try {
    const booking = await Booking.findOne({ periodId });
    res.json(booking || {});
  } catch (err) {
    res.status(500).json({ error: 'Error fetching booking' });
  }
});

module.exports = router;