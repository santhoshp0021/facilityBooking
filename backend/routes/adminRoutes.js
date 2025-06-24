const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const User = require('../models/User');
const {Booking, BookingHistory} =require('../models/BookingHistory');
const Weektable = require('../models/Weektable');
const HallRequest = require('../models/HallRequest');
const {getWeekStart} = require('../utils');

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

router.post('/free-slot-period', async (req, res) => {
    const { facilityName, type, date, periodNo, userId } = req.body;
  
    if (!facilityName || !type || !date || !periodNo || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const day = dateObj.getDay();
    const periodId = `${periodNo}-${day}`;
    var weekStart = getWeekStart(date); // Monday of that week
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
  
    
  
    try {
      // 2. Get user email
      const admin = await User.findOne({ userId : 'myadmin'});
      const user = await User.findOne({ userId });
      if (!user || !user.email) {
        return res.status(404).json({ error: 'User email not found' });
      }
      // 3. Send email to user
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: admin.email, // replace with real admin email
          pass: 'ibkbdwgufmxzfmqa'   // use app password or secure method
        }
      });
  
      const mailOptions = {
        from: admin.email,
        to: user.email,
        subject: 'Slot Freed by Admin',
        text: `Your booking for ${facilityName} (${type}) on ${date}, period ${periodNo} has been freed by the admin.`
      };
  
      await transporter.sendMail(mailOptions);
  
      // 4. Update Weektable
      const index = (day - 1) * 8 + (periodNo - 1); // 0-based index
      const weektable = await Weektable.findOne({ userId, weekStart });
      if (!weektable) {
        return res.status(404).json({ error: 'Weektable not found for user' });
      }
      // Update specific period
      const periodToUpdate = weektable.periods[index];
      if (periodToUpdate) {
  
        if (type === 'room') {
          periodToUpdate.free = true;
          periodToUpdate.roomNo = "";
        } else if (type === 'lab') {
          periodToUpdate.free = true;
          periodToUpdate.lab = "";
        } else if (type === 'projector') {
          periodToUpdate.projector = "";
        }
      }
  
      await weektable.save();
      const userObj = await User.findOne({ userId });
      await BookingHistory.create({
        userId: userObj._id,
        periodId,
        usageDate: dateObj,
        facility: { name: facilityName, type: type, free: true }
      });
      res.json({ message: 'Slot freed and user notified.' });
      if (dateObj < weekStart || dateObj >= weekEnd) return
      // 1. Free the slot in Booking
      const result = await Booking.findOneAndUpdate(
        { periodId },
        {
          $set: {
            "facilities.$[f].free": true,
            "facilities.$[f].bookedBy": ""
          }
        },
        {
          arrayFilters: [{ "f.name": facilityName, "f.type": type }],
          new: true
        }
      );
      
    } catch (err) {
      console.error('Error freeing slot:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/free-slot-hall', async (req, res) => {
  const { hallName, date, startTime, endTime, userId } = req.body;
  console.log(hallName, date, startTime, endTime, userId);
  if (!hallName || !date || !startTime || !endTime || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Find and update the HallRequest status to rejected
    const hallReq = await HallRequest.findOneAndUpdate(
      {
        userId,
        hallName,
        date,
        startTime:{$lte: startTime},
        endTime: {$gte: endTime},
        status: 'accepted'
      },
      {
        $set: { status: 'rejected' }
      },
      { new: true }
    );

    if (!hallReq) {
      return res.status(404).json({ error: 'No matching accepted hall booking found' });
    }

    // 2. Fetch the user's email
    const user = await User.findOne({ userId });
    const admin = await User.findOne({ userId: "myadmin"})
    if (!user || !user.email) {
      return res.status(404).json({ error: 'User email not found' });
    }

    // 3. Send email notification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: admin.email, // admin email
        pass: 'ibkbdwgufmxzfmqa'   // app password from Gmail
      }
    });

    const mailOptions = {
      from: '',
      to: user.email,
      subject: `Hall Slot Cancelled by Admin`,
      text: `Your hall booking for ${hallName} on ${date} from ${startTime} to ${endTime} (Event: ${hallReq.eventName}) has been cancelled by the admin.`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Hall booking status set to rejected and user notified' });
  } catch (err) {
    console.error('Error freeing hall slot:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;