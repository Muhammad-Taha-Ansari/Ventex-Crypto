const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    match: [/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        const monthDiff = today.getMonth() - value.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < value.getDate())) {
          return age - 1 >= 18;
        }
        return age >= 18;
      },
      message: 'You must be at least 18 years old to use this service',
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    // Note: Password validation is handled in the controller before hashing
    // The hashed password will be stored here
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  accountLockedUntil: {
    type: Date,
  },
  balance: {
    type: Number,
    default: 0, // Starting balance - users must add funds
    min: [0, 'Balance cannot be negative'],
  },
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

