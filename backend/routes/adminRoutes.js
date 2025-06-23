const express = require('express');
const router = express.Router();
const Weektable = require('../models/Weektable');
const HallRequest = require('../models/HallRequest');

router.get('/available-week-dates', async (req, res) => {
  try {
    const weekStarts = await Weektable.distinct('weekStart');

    const weekdayDates = weekStarts.flatMap(weekStart => {
      const sunday = new Date(weekStart);
      const weekdays = [];

      for (let i = 1; i <= 5; i++) { // Monday (1) to Friday (5)
        const weekday = new Date(sunday);
        weekday.setDate(sunday.getDate() + i);
        weekdays.push(weekday.toISOString().split('T')[0]); // 'YYYY-MM-DD'
      }

      return weekdays;
    });

    // Remove duplicates and sort
    const uniqueDates = [...new Set(weekdayDates)].sort((a, b) => new Date(a) - new Date(b));

    res.json(uniqueDates);
  } catch (err) {
    console.error('Error generating weekday dates:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/usage-status', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Missing date' });
  
    try {
      const usageMap = {};
      // Fetch all hall bookings for the date
      const halls = await HallRequest.find({ date, status: 'accepted' });
      for (const booking of halls) {
        if (!usageMap[booking.hallName]) {
          usageMap[booking.hallName] = { name: booking.hallName, type: 'hall', usage: [] };
        }
        usageMap[booking.hallName].usage.push({
          startTime: booking.startTime,
          endTime: booking.endTime,
          bookedBy: booking.userId,
          eventName: booking.eventName
        });
      }
      // Fetch all Weektables that may contain bookings on the given date
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay(); // 1 = Monday ... 5 = Friday
  
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const weekStart = new Date(dateObj);
        weekStart.setDate(dateObj.getDate() - (dayOfWeek % 7)+1); // get Sunday
        weekStart.setHours(0, 0, 0, 0);
        const weektables = await Weektable.find({ weekStart });
        for (const wt of weektables) {
          for (const period of wt.periods) {
            if (period.day !== dayOfWeek || period.free) continue;
  
            const facList = [];
  
            if (period.roomNo) facList.push({ name: period.roomNo, type: 'room' });
            if (period.lab) facList.push({ name: period.lab, type: 'lab' });
            if (period.projector) facList.push({ name: period.projector, type: 'projector' });
  
            for (const fac of facList) {
              const key = fac.name;
              if (!usageMap[key]) {
                usageMap[key] = { name: key, type: fac.type, usage: [] };
              }
              usageMap[key].usage.push({
                periodNo: period.periodNo,
                startTime: period.startTime,
                endTime: period.endTime,
                bookedBy: wt.userId
              });
            }
          }
        }
      }
      res.json(usageMap);
    } catch (err) {
      console.error('Error in /admin-usage-status:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
module.exports = router;
