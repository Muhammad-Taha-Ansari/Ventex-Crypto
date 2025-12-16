import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import vantexLogo from '../assets/WhatsApp_Image_2025-12-06_at_11.10.34_PM-removebg-preview.png';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = [];
    const newFieldErrors = {};

    if (!formData.username || formData.username.trim().length < 3) {
      newErrors.push('Username must be at least 3 characters');
      newFieldErrors.username = 'Username must be at least 3 characters';
    }
    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.push('Username can only contain letters, numbers, and underscores');
      newFieldErrors.username = 'Only letters, numbers, and underscores allowed';
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.push('Please provide a valid email address');
      newFieldErrors.email = 'Please provide a valid email address';
    }

    if (!formData.firstName || formData.firstName.trim().length === 0) {
      newErrors.push('First name is required');
      newFieldErrors.firstName = 'First name is required';
    }

    if (!formData.lastName || formData.lastName.trim().length === 0) {
      newErrors.push('Last name is required');
      newFieldErrors.lastName = 'Last name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.push('Date of birth is required');
      newFieldErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
      
      if (actualAge < 18) {
        newErrors.push('You must be at least 18 years old to use this service');
        newFieldErrors.dateOfBirth = 'You must be at least 18 years old';
      }
      if (dob > today) {
        newErrors.push('Date of birth cannot be in the future');
        newFieldErrors.dateOfBirth = 'Date cannot be in the future';
      }
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.push('Password must be at least 8 characters');
      newFieldErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.push('Password must contain uppercase, lowercase, number, and special character');
      newFieldErrors.password = 'Must include uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);
    setFieldErrors({});

    try {
      const result = await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setLoading(false);

      if (result.success) {
        navigate('/dashboard');
      } else {
        const errorMessages = result.errors || [result.message];
        setErrors(errorMessages);
        
        // Parse specific error messages
        const newFieldErrors = {};
        errorMessages.forEach(error => {
          if (error.toLowerCase().includes('username') && error.toLowerCase().includes('exists')) {
            newFieldErrors.username = 'Username already taken';
          } else if (error.toLowerCase().includes('email') && error.toLowerCase().includes('exists')) {
            newFieldErrors.email = 'Email already registered';
          }
        });
        setFieldErrors(newFieldErrors);
      }
    } catch (error) {
      setLoading(false);
      setErrors(['An unexpected error occurred. Please try again.']);
    }
  };

  // Calculate max date (18 years ago)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Left Side - Branding & Animation */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Branding Content */}
        <div className="relative z-10 text-center max-w-lg">
          {/* Logo */}
          <div className="mb-8 animate-float">
            <img 
              src={vantexLogo} 
              alt="VANTEX Logo" 
              className="w-32 h-32 object-contain mx-auto border-0 outline-none"
              style={{ background: 'transparent' }}
            />
          </div>

          {/* App Name */}
          <h1 className="text-7xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6 tracking-tight animate-fadeIn">
            VANTEX
          </h1>

          {/* Tagline */}
          <p className="text-2xl text-white/80 mb-4 font-light animate-fadeIn animation-delay-300">
            Join the Future
          </p>
          <p className="text-lg text-white/60 mb-8 animate-fadeIn animation-delay-600">
            Start your cryptocurrency trading journey today
          </p>

          {/* Animated Features */}
          <div className="space-y-4 mt-12 animate-fadeIn animation-delay-900">
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
              <span>Instant account creation</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse animation-delay-200"></div>
              <span>Advanced trading tools</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse animation-delay-400"></div>
              <span>24/7 customer support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Card with glassmorphism effect */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-white/60 text-sm">Join VANTEX and start trading cryptocurrencies</p>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 rounded-xl border bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50 backdrop-blur-sm animate-slideDown">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold mb-1.5 text-red-300">Registration Failed</p>
                    <ul className="space-y-1 text-red-200 text-sm">
                      {errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0"></span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/40 
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                      transition-all duration-200 backdrop-blur-sm
                      ${fieldErrors.firstName ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:border-white/20'}`}
                    placeholder="John"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1.5 text-xs text-red-400">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/40 
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                      transition-all duration-200 backdrop-blur-sm
                      ${fieldErrors.lastName ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:border-white/20'}`}
                    placeholder="Doe"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1.5 text-xs text-red-400">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/40 
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    transition-all duration-200 backdrop-blur-sm
                    ${fieldErrors.username ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:border-white/20'}`}
                  placeholder="johndoe"
                />
                {fieldErrors.username ? (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.username}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-white/50">Only letters, numbers, and underscores</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/40 
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    transition-all duration-200 backdrop-blur-sm
                    ${fieldErrors.email ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:border-white/20'}`}
                  placeholder="john@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white/90 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={maxDate}
                  required
                  className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white 
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                    transition-all duration-200 backdrop-blur-sm
                    ${fieldErrors.dateOfBirth ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:border-white/20'}`}
                />
                {fieldErrors.dateOfBirth ? (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.dateOfBirth}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-white/50">You must be at least 18 years old</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/40 
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                        transition-all duration-200 backdrop-blur-sm
                        ${fieldErrors.password ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:border-white/20'}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/70 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L12 12m-5.71-5.71L12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-white/50">Uppercase, lowercase, number, special char</p>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/40 
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                        transition-all duration-200 backdrop-blur-sm
                        ${fieldErrors.confirmPassword ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:border-white/20'}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white/70 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L12 12m-5.71-5.71L12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white font-semibold py-3.5 px-4 rounded-xl 
                  hover:from-purple-500 hover:via-purple-400 hover:to-blue-500 
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent 
                  transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed 
                  shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Footer Link */}
            <p className="mt-6 text-center text-white/60 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-900 {
          animation-delay: 0.9s;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Signup;
