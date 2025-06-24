const mongoose = require('mongoose');
const audiReqSchema= new mongoose.Schema({
  userId: { type: String, required: true },
  venue: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  eventName:{type:String, required: true},
  additionalInfo:{type:String},
  date: { type: String, required: true },
  pdf: { data: Buffer, contentType: String },
  bookedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
});
const AuditoriumRequest = mongoose.model('AuditoriumRequest', audiReqSchema);
module.exports=AuditoriumRequest;