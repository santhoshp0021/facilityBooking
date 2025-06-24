const express = require('express');
const router = express.Router();
const HallRequest = require('../models/HallRequest');
const multer = require('multer');

// Multer config for PDF uploads (max 2MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed!'));
  }
});

// API to create a hall booking request (with PDF)
router.post('/hall-request', upload.single('pdf'), async (req, res) => {
  const { userId, hallName, date, startTime, endTime, eventName } = req.body;
  if (!userId || !hallName || !date || !startTime || !endTime || !eventName) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Supporting PDF is required' });
  }
  try {
    // Overlap condition: check if any accepted booking for this hall and date overlaps the requested time
    const overlap = await HallRequest.findOne({
      hallName,
      date,
      status: { $in: ['accepted'] },
      $or: [
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
      endTime,
      eventName,
      pdf: { data: req.file.buffer, contentType: req.file.mimetype }
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
      // Encode PDF buffer to base64 for each request
      const requestsWithBase64 = requests.map(r => {
        const obj = r.toObject();
        if (obj.pdf && obj.pdf.data) {
           const buf = obj.pdf.data.buffer ? obj.pdf.data.buffer : obj.pdf.data;
  obj.pdf.data = Buffer.from(buf).toString('base64');
     }
        return obj;
      });
      res.json(requestsWithBase64);
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
    if (!['accepted', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    try {
      await HallRequest.findByIdAndUpdate(id, { status });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Could not update status' });
    }
});

router.get('/hall-requests/slots', async (req, res) => {
  const { hallName, date } = req.query;

  if (!hallName || !date) {
    return res.status(400).json({ error: 'hallName and date are required' });
  }

  try {
    const bookings = await HallRequest.find({ hallName, date, status: "accepted" });
    // Encode PDF buffer to base64 for each booking
    const bookingsWithBase64 = bookings.map(r => {
      const obj = r.toObject();
      if (obj.pdf && obj.pdf.data) {
         const buf = obj.pdf.data.buffer ? obj.pdf.data.buffer : obj.pdf.data;
  obj.pdf.data = Buffer.from(buf).toString('base64');
      }
      return obj;
    });
    res.json(bookingsWithBase64);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
  
module.exports = router;