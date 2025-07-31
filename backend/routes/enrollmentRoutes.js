const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// Get enrolled courses for a user (for dropdown selection)
router.get('/courses', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const enrollment = await Enrollment.findOne({ userId });
    if (!enrollment) return res.json([]);
    res.json(enrollment.enrolled);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching enrolled courses' });
  }
});

router.delete('/:userId', async (req, res) => {
    try {
      const result = await Enrollment.deleteOne({ userId: req.params.userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json({ message: "Enrollment deleted" });
    } catch (err) {
      res.status(500).json({ error: "Error deleting enrollment" });
    }
});

router.get('/all', async (req, res) => {
    try {
      const enrollments = await User.find({role:"student_rep"});
      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching enrollments' });
    }
});

router.post('/', async (req, res) => {
  const { userId, enrolled } = req.body;
  if (!userId || !Array.isArray(enrolled) || enrolled.length === 0) {
    return res.status(400).json({ error: 'userId and enrolled (array of courses) are required' });
  }
  try {
    // Validate each course object
    for (const course of enrolled) {
      if (
        typeof course.courseCode !== "string" ||
        typeof course.courseName !== "string" ||
        typeof course.staffName !== "string" ||
        typeof course.lab !== "boolean"
      ) {
        return res.status(400).json({ error: "Each course must have courseCode, courseName, staffName (string), and lab (boolean)" });
      }
    }
    // Upsert logic
    let enrollment = await Enrollment.findOne({ userId });
    if (enrollment) {
      enrollment.enrolled = enrolled;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({ userId, enrolled });
    }
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ error: 'Error updating enrollment', details: err.message });
  }
});
module.exports = router;