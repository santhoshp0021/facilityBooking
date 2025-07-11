const express = require('express');
const router = express.Router();
const { getCurrentWeekStart} = require('../utils');
const User =  require('../models/User');
const Weektable =  require('../models/Weektable');
const { BookingHistory } = require('../models/BookingHistory');

// Book a projector for a period (update Weektable for the booking user only)
router.post('/book-projector', async (req, res) => {
    const { userId, periodId, projectorName } = req.body;
    // If any required field is missing or empty, return 400
    if (!userId || !periodId || !projectorName || typeof projectorName !== 'string' || !projectorName.trim()) {
      return res.status(400).json({ error: 'userId, periodId, and projectorName required' });
    }
    try {
      const dateObj = new Date();
      dateObj.setHours(0,0,0,0);
      // Insert into booking history
      const userObj = await User.findOne({ userId });
      await BookingHistory.create({
        userId: userObj._id,
        periodId,
        usageDate: dateObj,
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
  
// Book a room for a period (update Weektable for the booking user only)
router.post('/book-room', async (req, res) => {
    const { userId, periodId, roomName, staffName, courseCode } = req.body;
    if (!userId || !periodId || !roomName) {
      return res.status(400).json({ error: 'userId, periodId, and roomName required' });
    }
    try {
      const dateObj = new Date();
       dateObj.setHours(0,0,0,0);
      // Insert into booking history
      const userObj = await User.findOne({ userId });
      await BookingHistory.create({
        userId: userObj._id,
        periodId,
        usageDate: dateObj,
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
  
// Book a lab for a period (update Weektable for the booking user only)
router.post('/book-lab', async (req, res) => {
    const { userId, periodId, labName, staffName, courseCode } = req.body;
    if (!userId || !periodId || !labName) {
      return res.status(400).json({ error: 'userId, periodId, and labName required' });
    }
    try {
      const dateObj = new Date();
      dateObj.setHours(0,0,0,0);
      // Insert into booking history
      const userObj = await User.findOne({ userId });
      await BookingHistory.create({
        userId: userObj._id,
        periodId,
        usageDate: dateObj,
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
    var facilityName,facilityType;
    const facilitiesToFree = [];
    if (period.roomNo && period.roomNo.trim()) {
      facilitiesToFree.push({ type: 'room', name: period.roomNo });
      facilityName = period.roomNo;
      facilityType = 'room';
    }
    else if (period.projector && period.projector.trim()) {
      facilitiesToFree.push({ type: 'projector', name: period.projector });
      facilityName = period.projector;
      facilityType = 'projector';
    }
    else if (period.lab && period.lab.trim()) {
      facilitiesToFree.push({ type: 'lab', name: period.lab });
      facilityName = period.lab;
      facilityType = 'lab';
    }

    const dateObj = new Date();
    dateObj.setHours(0,0,0,0);
    await BookingHistory.create({
      userId: user._id,
      periodId,
      usageDate:dateObj,
      facility: { name: facilityName, type: facilityType, free: true }
    });
    // Now clear the user's weektable period fields
    period.free = true;
    period.staffName = '';
    period.courseCode = '';
    period.roomNo = '';
    period.lab = '';
    period.projector = ""; 

    await weektable.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error freeing period' });
  }
});

module.exports = router;