// Validation middleware for request data

exports.validateRegister = (req, res, next) => {
  const { username, email, firstName, lastName, dateOfBirth, password, confirmPassword } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // First name validation
  if (!firstName || firstName.trim().length === 0) {
    errors.push('First name is required');
  }
  if (firstName && !/^[a-zA-Z\s'-]+$/.test(firstName)) {
    errors.push('First name can only contain letters, spaces, hyphens, and apostrophes');
  }

  // Last name validation
  if (!lastName || lastName.trim().length === 0) {
    errors.push('Last name is required');
  }
  if (lastName && !/^[a-zA-Z\s'-]+$/.test(lastName)) {
    errors.push('Last name can only contain letters, spaces, hyphens, and apostrophes');
  }

  // Date of birth validation
  if (!dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
    
    if (actualAge < 18) {
      errors.push('You must be at least 18 years old to use this service');
    }
    if (dob > today) {
      errors.push('Date of birth cannot be in the future');
    }
  }

  // Password validation
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  // Confirm password validation
  if (!confirmPassword) {
    errors.push('Please confirm your password');
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

