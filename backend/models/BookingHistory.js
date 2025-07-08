const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    free: { type: Boolean, default: true },
    bookedBy:{type:String,default:''},
    bookable: {type: Boolean, default: true}
});
const Facility = mongoose.model('Facility', facilitySchema);

const bookingSchema = new mongoose.Schema({
    periodId: { type: String, required: true, unique: true },
    facilities: { type: [facilitySchema] },
});
const Booking = mongoose.model('Booking', bookingSchema);

const bookingHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    periodId: { type: String, required: true },
    facility: { type: facilitySchema },
    usageDate: {type:Date, required:true},
    date: { type: Date, default: Date.now }
});
const BookingHistory = mongoose.model('BookingHistory', bookingHistorySchema);

module.exports = { Facility, Booking, BookingHistory};