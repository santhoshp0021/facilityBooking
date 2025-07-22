const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:{type:String ,required:true, enum:['student','student_rep', 'faculty', 'secretary','csea_member', 'admin']},
  email:{ type: String, required:true}
});
const User = mongoose.model('User', userSchema);

module.exports = User;