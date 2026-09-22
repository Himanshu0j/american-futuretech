const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  role: {
    type: String,
    enum: ['SUPERADMIN', 'ADMIN', 'COUNSELOR', 'INSTRUCTOR', 'STUDENT', 'SuperAdmin', 'Admin', 'Counselor', 'Instructor'],
    default: 'STUDENT',
  },
  permissions: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  bio: {
    type: String,
    default: '',
  },
  // Student-specific profile fields
  studentDetails: {
    enrollmentNumber: { type: String, default: '' },
    assignedBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    targetCareer: { type: String, default: '' },
    linkedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  },
}, {
  timestamps: true,
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
