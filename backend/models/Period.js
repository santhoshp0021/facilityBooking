const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodNo: { type: Number, required: true },
  day: { type: Number, required: true },
  periodId: { type: String, required: true },
  free: { type: Boolean, default: true },
  roomNo: { type: String },
  courseCode: { type: String }, 
  staffName: { type: String },
  lab: { type: String },
  startTime:{ type: String, required: true }, 
  endTime:{ type: String, required: true }, 
});
const Period = mongoose.model('Period', periodSchema);

module.exports = Period;