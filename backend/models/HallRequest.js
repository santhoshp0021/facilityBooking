const mongoose = require('mongoose');

const hallReqSchema= new mongoose.Schema({
  userId: { type: String, required: true },
  hallName: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  eventName:{ type: String, required: true },
  date: { type: String, required: true },
  bookedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
});
const HallRequest = mongoose.model('HallRequest', hallReqSchema);

module.exports = HallRequest;