const express = require('express');
const router = express.Router();
const AuditoriumRequest = require('../models/AuditoriumRequest');
const multer = require('multer');

// Multer setup for PDF upload (max 2MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  }
});

// API to create an auditorium booking request with PDF
router.post('/audi-request', upload.single('pdf'), async (req, res) => {
  try {
    const { userId, date, startTime, endTime, eventName, venue, additionalInfo } = req.body;

    // Basic validation
    if (!userId || !date || !startTime || !endTime || !eventName || !venue) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Supporting PDF is required.' });
    }

    const booking = {
      userId,
      date,
      startTime,
      endTime,
      eventName,
      venue,
      additionalInfo,
      pdf: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    };

    await AuditoriumRequest.create(booking);
    res.status(200).json({ message: 'Booking submitted successfully.' });
  } catch (err) {
    console.error('Booking error:', err);
    if (err.message && err.message.includes('PDF')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Get all auditorium requests by status and userId (for accepted receipts)
router.get('/audi-requests', async (req, res) => {
  const { status, userId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  try {
    const requests = await AuditoriumRequest.find(filter).sort({ bookedAt: -1 });
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
    res.status(500).json({ error: 'Could not fetch audi requests' });
  }
});

// Update status of an auditorium request
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