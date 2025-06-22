const mongoose =require('mongoose');
const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true},
  courseName: { type: String, required: true },
  staffName: { type: String, required: true },
  lab:{ type: Boolean, default: false }
});
const enrollmentSchema = new mongoose.Schema({
  userId: { type: String, required: true,unique:true }, // remove unique: true
  enrolled: { type: [courseSchema], default: [] },

});
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;