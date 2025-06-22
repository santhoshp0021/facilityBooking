const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:{type:String ,required:true, enum:['student', 'secretary', 'admin']},
});
const User = mongoose.model('User', userSchema);

module.exports = User;