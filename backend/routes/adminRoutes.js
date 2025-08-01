const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const multer = require('multer');
const xlsx = require('xlsx');
const router = express.Router();
const { BookingHistory} =require('../models/BookingHistory');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const Weektable = require('../models/Weektable');
const Enrollment = require('../models/Enrollment');
const HallRequest = require('../models/HallRequest');
const AuditoriumRequest = require('../models/AuditoriumRequest');
const {getWeekStart} = require('../utils');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(xlsx)$/)) {
      return cb(new Error('Only .xlsx files are allowed'));
    }
    cb(null, true);
  }
});

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
      // 3. Send email to user
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: admin.email, // replace with real admin email
          pass: 'gvuvoumzoufcimcp'//'ibkbdwgufmxzfmqa'   // use app password or secure method
        }
      });
  
      const mailOptions = {
        from: admin.email,
        to: user.email,
        subject: 'Slot Freed by Admin',
        text: `Booking cancellation:\nFacility : ${facilityName}\nType : ${type}\nDate :  ${date}\nPeriod:${periodNo}\nThe booking has been freed by the admin.`
      };
  
      await transporter.sendMail(mailOptions);
      res.json({ message: 'Slot freed and user notified.' });
      if (dateObj < weekStart || dateObj >= weekEnd) return
      
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
        $set: { status: 'withdrawn' }
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
        pass: 'gvuvoumzoufcimcp'//'ibkbdwgufmxzfmqa'   // app password from Gmail
      }
    });

    const mailOptions = {
      from: 'admin.email',
      to: user.email,
      subject: `Hall Slot Cancelled by Admin`,
      text: `Hall:${hallName}\nDate:${date}\nTime: ${startTime} - ${endTime} \nEvent: ${hallReq.eventName}\nBooking has been withdrawn by the admin.`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Hall booking status set to withdrawn and user notified' });
  } catch (err) {
    console.error('Error freeing hall slot:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Register
router.post('/register', async (req, res) => {
  const { password, role, userId, email } = req.body;
  try {
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: 'userId already registered' });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10); // or use 12 rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({  
      password: hashedPassword,
      role,
      userId,
      email
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//Bulk Register
router.post('/register/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty or invalid' });
    }

    const users = [];

    for (let row of rawData) {
      // Support both lowercase and capitalized column headers
      const userId = row.userId || row.UserId;
      const password = row.password || row.Password;
      const email = row.email || row.Email;
      const role = row.role || row.Role;

      if (!userId || !password || !email || !role) continue;

      const existingUser = await User.findOne({ userId });
      if (existingUser) continue;

      const hashedPassword = await bcrypt.hash(password, 10);

      users.push({
        userId: String(userId).trim(),
        password: hashedPassword,
        email: String(email).trim(),
        role: role.trim()
      });
    }

    if (users.length === 0) {
      return res.status(400).json({ message: 'No valid users to register' });
    }

    const result = await User.insertMany(users, { ordered: false });

    res.status(200).json({ message: `${result.length} users registered successfully`, insertedCount: result.length });
  } catch (err) {
    console.error('Bulk register error:', err);
    res.status(500).json({ message: 'Bulk registration failed', error: err.message });
  }
});

// ✅ Delete a single user and all related data
router.delete('/delete', async (req, res) => {
  const {userId} = req.body;
  try {
    const deletedUser = await User.findOneAndDelete({ userId });
    console.log(deletedUser);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Promise.all([
      Timetable.deleteMany({ userId }),
      Weektable.deleteMany({ userId }),
      Enrollment.deleteMany({ userId }),
      HallRequest.deleteMany({ userId }),
      AuditoriumRequest.deleteMany({ userId }),
      BookingHistory.deleteMany({ userId : deletedUser._id})
    ]);

    res.json({ message: `User ${userId} and related data deleted successfully` });
  } catch (err) {
    console.error('Error in delete:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Bulk delete users from Excel and related data
router.post('/delete/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const userIds = data
      .map(row => row.userId || row.UserId)
      .filter(Boolean)
      .map(id => String(id).trim());

    if (!userIds.length) {
      return res.status(400).json({ message: 'No valid userIds in Excel file' });
    }

    // Step 1: Get users and their ObjectIds
    const users = await User.find({ userId: { $in: userIds } }, '_id userId');
    const objectIds = users.map(u => u._id);

    // Step 2: Perform delete operations
    const deleteOps = [
      User.deleteMany({ userId: { $in: userIds } }),
      Timetable.deleteMany({ userId: { $in: userIds } }),
      Weektable.deleteMany({ userId: { $in: userIds } }),
      Enrollment.deleteMany({ userId: { $in: userIds } }),
      HallRequest.deleteMany({ userId: { $in: userIds } }),
      AuditoriumRequest.deleteMany({ userId: { $in: userIds } }),
      BookingHistory.deleteMany({ userId: { $in: objectIds } })
    ];

    const [userResult] = await Promise.all(deleteOps);

    res.json({
      message: `${userResult.deletedCount} users and related data deleted successfully`, deletedCount: userResult.deletedCount
    });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ message: 'Bulk delete failed', error: err.message });
  }
});


module.exports = router;