const mongoose = require('mongoose');
const schedule = require('node-schedule');

const User =  require('./models/User');
const Weektable =  require('./models/Weektable');
const Timetable =  require('./models/Timetable');
const Period =  require('./models/Period');
const {Booking, BookingHistory} = require('./models/BookingHistory');

const availabilityRoutes = require('./routes/availabilityRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const facilityRoutes = require('./routes/facultyRoutes');
const audiRoutes = require('./routes/audiRoutes');
const hallRoutes = require('./routes/hallRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const bookRoutes = require('./routes/bookRoutes');

const updateBookingsForWeek = require('./wkbook');
const {
  getCurrentWeekStart,
  ensureWeektablesForAllUsers, 
  syncFacilityStatusWithWeektables, 
  ensureWeektablesForAllUsersCall 
} = require('./utils');

const express = require('express');
const cors = require('cors'); // Add this line
const app = express();

app.use(cors()); // Add this line
app.use(express.json());
app.use('/api/faculty',facultyRoutes);
app.use('/api',facilityRoutes);
app.use('/api',audiRoutes);
app.use('/api',hallRoutes);
app.use('/api/enrollment',enrollmentRoutes);
app.use('/api',availabilityRoutes);
app.use('/api',bookRoutes);

// Connect to MongoDB
mongoose.connect('mongodb+srv://Vishva06:vishva2006@cluster0.1odrrkw.mongodb.net/facilitydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// updateBookingsForWeek().catch(console.error);

schedule.scheduleJob('30 22 * * 0', () => {
  syncFacilityStatusWithWeektables()
    .then(() => console.log('Facility status synced with weektables (weekly job, Sunday 23:56)'))
    .catch(err => console.error('Error syncing facility status (weekly job):', err));
  ensureWeektablesForAllUsersCall()
    .then(() => console.log('Weektables ensured for all users (weekly job, Sunday 23:56)'))
    .catch(err => console.error('Error ensuring weektables for all users (weekly job):', err)); 
});

// Login route to log username and password into userschema
app.post('/api/login', async (req, res) => {
   const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'userId and password required' });
  }
  try {
    const user = await User.findOne({ userId, password });
    if (user) {
      res.json({ success: true, userId: user.userId, role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid userId or password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

//Register 
app.post('/api/register', async (req, res) => {
  const {  password, role, userId } = req.body;
  try {
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: 'userId already registered' });
    }
    const newUser = new User({  
      password,
      role,
      userId
    });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Call this on server startup ---
ensureWeektablesForAllUsers().then(() => {
  console.log('');
}).catch(err => {
  console.error('Error ensuring weektables:', err);
});

// API to get today's 8 periods for a user from weektable
app.get('/api/user/:userId/today-periods', async (req, res) => {
  const { userId } = req.params;
  // Get today's day as number (1=Monday, ..., 5=Friday)
  const today = new Date();
  const dayNum = today.getDay(); // 1=Monday, ..., 5=Friday
  if (dayNum < 1 || dayNum > 5) {
    return res.json({ periods: [] }); // Not a working day
  }
  try {
    // Find the user by userId string
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find the current week's weektable for this user
    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({
      userId: user.userId,
      weekStart: weekStart
    }).populate('periods');

    if (!weektable) return res.json({ periods: [] });

    // Filter periods for today
    const periodsToday = weektable.periods.filter(period => period.day === dayNum);

    res.json({ periods: periodsToday });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching periods' });
  }
});

// API to get all periods for the current week for a user
app.get('/api/weekperiod-details', async (req, res) => {
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
app.get('/api/projector-bookings', async (req, res) => {
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

// Debug endpoint to list all booking periodIds
app.get('/api/debug-bookings', async (req, res) => {
  const bookings = await Booking.find({}, { periodId: 1, _id: 0 });
  res.json(bookings);
});

// Get all periods for today (Monday-Friday)
app.get('/api/periods-today', async (req, res) => {
  try {
    const today = new Date();
    const dayNum = today.getDay(); // 0=Sunday, 1=Monday, ...
    if (dayNum < 1 || dayNum > 5) return res.json([]); // Only Mon-Fri
    // Find all periods for today
    const periods = await Period.find({ day: dayNum });
    res.json(periods);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching today\'s periods' });
  }
});

// Get the lab name for a user and periodId from weektable
app.get('/api/weektable/lab-booking', async (req, res) => {
  const { userId, periodId } = req.query;
  if (!userId || !periodId) return res.status(400).json({ error: 'userId and periodId required' });

  try {
    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });

    const period = weektable.periods.find(p => p.periodId === periodId);
    if (!period) return res.status(404).json({ error: 'Period not found' });

    res.json({ lab: period.lab });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching lab booking' });
  }
});

// Free a lab by lab name and periodId, and update weektable
app.post('/api/labs/free-by-name', async (req, res) => {
  const { labName, periodId, userId } = req.body;
  if (!labName || !periodId || !userId) return res.status(400).json({ error: 'labName, periodId, and userId required' });

  try {
    // Update Booking: set lab free for this period
    const booking = await Booking.findOne({ periodId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const lab = booking.facilities.find(f => f.type === 'lab' && f.name === labName);
    if (!lab) return res.status(404).json({ error: 'Lab not found' });

    lab.free = true;
    lab.bookedBy='';
    await booking.save();

    // Insert into booking history for freeing
    const userObj = await User.findOne({ userId });
    await BookingHistory.create({
      userId: userObj._id,
      periodId,
      facility: { name: labName, type: 'lab', free: true }
    });

    // Update Weektable: clear lab and other details for this period for this user
    const weekStart = getCurrentWeekStart();
    const weektable = await Weektable.findOne({ userId, weekStart });
    if (!weektable) return res.status(404).json({ error: 'Weektable not found' });

    const period = weektable.periods.find(p => p.periodId === periodId);
    if (!period) return res.status(404).json({ error: 'Period not found' });

    period.free = true;
    period.lab = '';
    period.staffName = '';
    period.courseCode = '';
    await weektable.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error freeing lab' });
  }
});

// API to get all booking history records (populates userId for username) with improved filters
app.get('/api/booking-history', async (req, res) => {
  try {
    const { facilityName, date } = req.query;
    const filter = {};
    if (facilityName) {
      // Case-insensitive, partial match for facility name
      filter['facility.name'] = { $regex: facilityName, $options: 'i' };
    }
    if (date) {
      // Match date only (ignore time)
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    const history = await BookingHistory.find(filter).populate('userId', 'userId').sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch booking history' });
  }
});

// Add this endpoint to allow frontend to fetch user info by userId
app.get('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      userId: user.userId,
      role: user.role
      // add other fields as needed
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user', details: err.message });
  }
});

// --- Dashboard API: Get current booking status for all facilities at a given date and time ---
/*app.get('/api/dashboard/facility-status', async (req, res) => {
  try {
    const { date, time } = req.query;

    // Compute weekStart for the selected date (Monday, local time)
    function getWeekStart(d) {
      const dateObj = new Date(d);
      const day = dateObj.getDay();
      // Monday as start of week (1)
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateObj);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    }
    // Use the selected date for weekStart and dayNum
    const selDateObj = date ? new Date(date) : new Date();
    const weekStart = getWeekStart(selDateObj);
    console.log('hi',weekStart);
    // Use provided time or current time in "HH:MM" 24-hour format
    let targetTime = time || (() => {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    })();

    // Parse selected time to minutes since midnight (24-hour only)
    const [selHour, selMin] = targetTime.split(':').map(Number);
    const selMinutes = selHour * 60 + selMin;

    // Helper to parse time string "HH:mm" (24-hour) or "H:mm"
    function parseTimeToMinutes(timeStr) {
      if (!timeStr) return null;
      let s = timeStr.trim();
      let match = s.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        let [, hour, min] = match;
        return parseInt(hour, 10) * 60 + parseInt(min, 10);
      }
      return null;
    }

    // Get all facilities for reference
    const allFacilities = facilities;

    // Get all weektables for this weekStart
    const weektables = await Weektable.find({ weekStart });

    // If no weektable records, all facilities are free
    if (!Array.isArray(weektables) || weektables.length === 0) {
      return res.json(
        allFacilities.map(fac => ({
          name: fac.name,
          type: fac.type,
          status: 'free',
          bookedBy: null,
          period: null
        }))
      );
    }

    // Find the day number for selectedDate (0=Sunday, 1=Monday, ..., 6=Saturday)
    const dayNum = selDateObj.getDay();

    // Only consider Monday-Friday (1-5)
    if (dayNum < 1 || dayNum > 5) {
      return res.json(
        allFacilities.map(fac => ({
          name: fac.name,
          type: fac.type,
          status: 'free',
          bookedBy: null,
          period: null
        }))
      );
    }

    // Map: facilityName -> { status, bookedBy, period }
    const facilityStatus = {};
    allFacilities.forEach(fac => {
      facilityStatus[fac.name] = {
        name: fac.name,
        type: fac.type,
        status: 'free',
        bookedBy: null,
        period: null
      };
    });

    // For each user's weektable, check periods for selected day and time
    for (const weektable of weektables) {
      const userId = weektable.userId;
      for (const period of weektable.periods) {
        if (Number(period.day) !== dayNum) continue;
        if (!period.startTime || !period.endTime) continue;
        const startMin = parseTimeToMinutes(period.startTime);
        const endMin = parseTimeToMinutes(period.endTime);
        if (startMin === null || endMin === null) continue;
        if (selMinutes >= startMin && selMinutes < endMin) {
          if (period.roomNo && period.roomNo.trim()) {
            facilityStatus[period.roomNo] = {
              name: period.roomNo,
              type: 'room',
              status: 'booked',
              bookedBy: userId,
              period: {
                startTime: period.startTime,
                endTime: period.endTime
              }
            };
          }
          if (period.lab && period.lab.trim()) {
            facilityStatus[period.lab] = {
              name: period.lab,
              type: 'lab',
              status: 'booked',
              bookedBy: userId,
              period: {
                startTime: period.startTime,
                endTime: period.endTime
              }
            };
          }
          if (period.projector && period.projector.trim()) {
            facilityStatus[period.projector] = {
              name: period.projector,
              type: 'projector',
              status: 'booked',
              bookedBy: userId,
              period: {
                startTime: period.startTime,
                endTime: period.endTime
              }
            };
          }
        }
      }
    }

    // Return as array
    res.json(Object.values(facilityStatus));
  } catch (err) {
    res.status(500).json({ error: 'Error fetching dashboard facility status', details: err.message });
  }
});*/

// --- API: Get all periods for today for a facility, showing booking status and user ---
app.get('/api/facility-periods-today', async (req, res) => {
  try {
    const { facilityName, type } = req.query;
    if (!facilityName || !type) {
      return res.status(400).json({ error: 'facilityName and type are required' });
    }
    // Get today's day number (1=Monday, ..., 5=Friday)
    const today = new Date();
    const dayNum = today.getDay();
    if (dayNum < 1 || dayNum > 5) {
      return res.json([]); // Not a working day
    }
    // Get current week start
    function getWeekStart(d) {
      const dateObj = new Date(d);
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateObj);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      return monday;
    }
    const weekStart = getWeekStart(today);
    // Get all weektables for this week
    const weektables = await Weektable.find({ weekStart });
    // Defensive: check weektables and periods
    if (!Array.isArray(weektables) || weektables.length === 0) {
      return res.json([]);
    }
    const periodMap = {};
    for (const weektable of weektables) {
      if (!weektable || !Array.isArray(weektable.periods)) continue;
      for (const period of weektable.periods) {
        if (!period || typeof period.day === 'undefined' || typeof period.periodNo === 'undefined') continue;
        if (Number(period.day) !== dayNum) continue;
        if (!periodMap[period.periodNo]) {
          periodMap[period.periodNo] = {
            periodNo: period.periodNo,
            startTime: period.startTime || '',
            endTime: period.endTime || '',
            booked: false,
            bookedBy: null
          };
        }
      }
    }
    for (const weektable of weektables) {
      const userId = weektable.userId;
      if (!weektable || !Array.isArray(weektable.periods)) continue;
      for (const period of weektable.periods) {
        if (!period || typeof period.day === 'undefined' || typeof period.periodNo === 'undefined') continue;
        if (Number(period.day) !== dayNum) continue;
        if (
          (type === 'room' && period.roomNo && period.roomNo.trim() === facilityName) ||
          (type === 'lab' && period.lab && period.lab.trim() === facilityName) ||
          (type === 'projector' && period.projector && period.projector.trim() === facilityName)
        ) {
          if (periodMap[period.periodNo]) {
            periodMap[period.periodNo].booked = true;
            periodMap[period.periodNo].bookedBy = userId;
          }
        }
      }
    }
    const periodsToday = Object.values(periodMap).sort((a, b) => a.periodNo - b.periodNo);
    res.json(periodsToday);
  } catch (err) {
    console.error('Error in /api/facility-periods-today:', err);
    res.status(500).json({ error: 'Error fetching facility periods', details: err.message });
  }
});

// --- NEW: API to get weektables by weekStart date ---
app.get('/api/weektables', async (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart) return res.json([]);
  // Normalize weekStart to Monday 00:00:00
  const d = new Date(weekStart);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const weektables = await Weektable.find({ weekStart: monday });
  res.json(weektables);
});


app.post('/api/timetable', async (req, res) => {
  const { userId, periods } = req.body;
  if (!userId || !Array.isArray(periods) || periods.length !== 40) {
    return res.status(400).json({ error: 'userId and 40 periods required' });
  }
  // Validate periodNo and day
  for (const p of periods) {
    if (
      typeof p.periodNo !== "number" ||
      p.periodNo < 1 ||
      p.periodNo > 8 ||
      typeof p.day !== "number" ||
      p.day < 1 ||
      p.day > 5
    ) {
      return res.status(400).json({ error: "Each period must have periodNo 1-8 and day 1-5" });
    }
  }
  try {
    // Remove existing timetable for user if present
    await Timetable.deleteOne({ userId });

    // Create 40 Period documents
    const periodDocs = await Period.insertMany(periods);

    // Create Timetable with the new period ObjectIds
    const timetable = await Timetable.create({
      userId,
      periods: periodDocs.map(p => p._id)
    });

    res.json({ success: true, timetable });
    ensureWeektablesForAllUsers().then(() => {
  console.log('');
}).catch(err => {
  console.error('Error ensuring weektables:', err);
});
  } catch (err) {
    res.status(500).json({ error: 'Error creating timetable', details: err.message });
  }
});


app.listen(5000, () => {
  console.log('Server running on port 5000');
});