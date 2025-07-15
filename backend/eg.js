const mongoose = require('mongoose');
const schedule = require('node-schedule');

const User =  require('./models/User');
const Weektable =  require('./models/Weektable');
const Timetable =  require('./models/Timetable');
const Period =  require('./models/Period');
const { BookingHistory } = require('./models/BookingHistory');

const availabilityRoutes = require('./routes/availabilityRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const audiRoutes = require('./routes/audiRoutes');
const hallRoutes = require('./routes/hallRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const bookRoutes = require('./routes/bookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { getCurrentWeekStart,ensureWeektablesForAllUsers } = require('./utils');

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); 
app.use(express.json());
app.use('/api/faculty',facultyRoutes);
app.use('/api',facilityRoutes);
app.use('/api',audiRoutes);
app.use('/api',hallRoutes);
app.use('/api/enrollment',enrollmentRoutes);
app.use('/api',availabilityRoutes);
app.use('/api',bookRoutes);
app.use('/api/admin',adminRoutes);

// Connect to MongoDB
mongoose.connect('mongodb+srv://Vishva06:vishva2006@cluster0.1odrrkw.mongodb.net/facilitydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {console.log('MongoDB connected');}).catch((err) => {console.error('MongoDB connection error:', err);});

// --- Call this on server startup ---
ensureWeektablesForAllUsers().then(() => {}).catch(err => {console.error('Error ensuring weektables:', err);});

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
  const {  password, role, userId, email } = req.body;
  try {
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: 'userId already registered' });
    }
    const newUser = new User({  
      password,
      role,
      userId,
      email
    });
    await newUser.save();
    ensureWeektablesForAllUsers();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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