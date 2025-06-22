const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }
});
const Facilities = mongoose.model('facility',facilitySchema);

module.exports = Facilities;