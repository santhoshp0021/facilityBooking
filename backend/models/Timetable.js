const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  periods: [{
    periodNo: Number,
    day: Number,
    periodId: String,
    free: Boolean,
    roomNo: { type: String, default: '' },
    courseCode: { type: String, default: '' },
    staffName: { type: String, default: '' },
    lab: { type: String, default: '' },
    projector: { type: String, default: '' },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' }
  }]
});

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;