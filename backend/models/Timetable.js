const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  userId: { type: String, required: true,unique:true }, // changed to String
  periods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Period' }],
});
const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;