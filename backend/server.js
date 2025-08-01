const mongoose = require('mongoose');
const schedule = require('node-schedule');
const multer = require('multer');
const xlsx = require('xlsx');

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
const timetableRoutes = require('./routes/timetableRoutes');
const { getCurrentWeekStart,ensureWeektablesForAllUsers } = require('./utils');

const express = require('express');
const bcrypt = require('bcrypt'); 
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
app.use('/api/timetable',timetableRoutes);

// Connect to MongoDB
mongoose.connect('mongodb+srv://Vishva06:vishva2006@cluster0.1odrrkw.mongodb.net/facilitydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {console.log('MongoDB connected');}).catch((err) => {console.error('MongoDB connection error:', err);});

// --- Call this on server startup ---
ensureWeektablesForAllUsers().then(() => {}).catch(err => {console.error('Error ensuring weektables:', err);});

// Login route to verify username and password
app.post('/api/login', async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'userId and password required' });
  }
  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(401).json({ error: 'Invalid userId or password' });
    }
    if (user.role === 'admin'){
      if(password === user.password){
        return res.json({ success: true, userId: user.userId, role: user.role });
      }
      else{
        return res.status(401).json({ error: 'Invalid userId or password' });
      }
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid userId or password' });
    }

    res.json({ success: true, userId: user.userId, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed', details: err.message });
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

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
