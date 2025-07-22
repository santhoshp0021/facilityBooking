const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Enrollment = require('../models/Enrollment');
const Timetable = require('../models/Timetable');
const Weektable = require('../models/Weektable');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

function getWeekStartWithOffset(weekOffset) {
  const now = new Date();
  const day = now.getDay(); // Sunday = 0
  const diff = (day === 0 ? -6 : 1) - day + (weekOffset * 7);
  now.setDate(now.getDate() + diff);
  now.setHours(0, 0, 0, 0);
  return now;
}

router.post('/upload-timetable', upload.single('timetable'), async (req, res) => {
  const userId = req.body.userId;
  const filePath = req.file.path;

  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Timetable'];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 6) {
      throw new Error("Invalid sheet format. Expected at least 6 rows for weekdays.");
    }

    const slotTimes = data[0].slice(1); // First row: period headers
    const startTimes = slotTimes.map(slot => slot.split('-')[0]);
    const endTimes = slotTimes.map(slot => slot.split('-')[1]);

    const courseMap = new Map();
    const processedPeriods = [];

    // ✅ STEP 1: Process the first 5 data rows for timetable
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const row = data[dayIdx + 1]; // skip header row
      const day = dayIdx + 1;

      for (let periodIdx = 0; periodIdx < 8; periodIdx++) {
        const cell = row?.[periodIdx + 1]; // skip 0th cell (day label)
        const periodNo = periodIdx + 1;
        const periodId = `${periodNo}-${day}`;
        const startTime = startTimes[periodIdx] || '';
        const endTime = endTimes[periodIdx] || '';

        if (cell && typeof cell === 'string') {
          const match = cell.match(/([A-Z]+\d+)\s*\((.*?)\)/);
          if (match) {
            const courseCode = match[1];
            const roomOrLab = match[2];
            const labMap = { GFL: 'Ground Floor Lab', FFL: 'First Floor Lab', SFL: 'Second Floor Lab', TFL: 'Third Floor Lab' };

            const isLab = labMap.hasOwnProperty(roomOrLab);
            const lab = isLab ? roomOrLab : '';
            const roomNo = isLab ? '' : roomOrLab;

            processedPeriods.push({
              periodNo,
              day,
              periodId,
              free: false,
              courseCode,
              staffName: '',
              roomNo,
              lab,
              projector: '',
              startTime,
              endTime
            });
            continue;
          }
        }

        // Default free period
        processedPeriods.push({
          periodNo,
          day,
          periodId,
          free: true,
          courseCode: '',
          staffName: '',
          roomNo: '',
          lab: '',
          projector: '',
          startTime,
          endTime
        });
      }
    }

    // ✅ STEP 2: Build course map from remaining rows
    for (let i = 6; i < data.length; i++) {
      const row = data[i];
      const courseName = row[1];
      const courseCode = row[2];
      const staffName = row[3];

      if (courseCode && courseName !== 'CourseName') {
        courseMap.set(courseCode, {
          courseCode,
          courseName,
          staffName
        });
      }
    }

    // ✅ STEP 3: Update staff names in periods
    for (let p of processedPeriods) {
      if (p.courseCode && courseMap.has(p.courseCode)) {
        p.staffName = courseMap.get(p.courseCode).staffName;
      }
    }

    // ✅ STEP 4: Replace or upsert Enrollment
    await Enrollment.findOneAndUpdate(
      { userId },
      { userId, enrolled: Array.from(courseMap.values()) },
      { upsert: true, new: true }
    );

    // ✅ STEP 5: Replace or upsert Timetable
    await Timetable.findOneAndUpdate(
      { userId },
      { userId, periods: processedPeriods },
      { upsert: true, new: true }
    );

    // ✅ STEP 6: Replace or create Weektable for next 5 weeks
    for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
      const weekStart = getWeekStartWithOffset(weekOffset);
      await Weektable.findOneAndUpdate(
        { userId, weekStart },
        { userId, periods: processedPeriods, weekStart },
        { upsert: true, new: true }
      );
    }

    fs.unlinkSync(filePath);
    res.status(200).json({ message: '✅ Timetable uploaded and processed successfully!' });

  } catch (err) {
    console.error("❌ Error processing timetable:", err);
    res.status(500).json({ error: 'Failed to process uploaded timetable.' });
  }
});

module.exports = router;
