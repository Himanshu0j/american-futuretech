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
  // Brute-force protection: failed attempts are counted per account and a
  // temporary lock is applied once the limit is crossed.
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  // Timestamp of the last password change; tokens issued before it are refused
  // so rotating a password also revokes every existing session.
  passwordChangedAt: {
    type: Date,
    default: null,
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
  // Only a *change* invalidates existing sessions — a brand-new document must
  // not reject the token issued moments later by its own login.
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Alias: profile/reset flows referenced this name but only matchPassword existed.
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

module.exports = mongoose.model('User', UserSchema);
