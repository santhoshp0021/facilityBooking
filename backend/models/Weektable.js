const mongoose = require('mongoose');

const weektableSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // changed to String
  periods: [
    {
      periodNo: { type: Number, required: true },
      day: { type: Number, required: true },
      periodId: { type: String, required: true },
      free: { type: Boolean, default: true },
      roomNo: { type: String },
      courseCode: { type: String }, // <-- fix typo here
      staffName: { type: String },
      lab: { type: String },
      projector: { type: String, default: "" } ,
      startTime:{type:String,default:""}, 
      endTime:{type:String,default:""}// <-- now a string, empty means free
    }
  ],
  weekStart: { type: Date, required: true }
});
const Weektable = mongoose.model('Weektable', weektableSchema);

module.exports = Weektable;