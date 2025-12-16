import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      // Handle rate limiting (429) and other errors
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      const statusCode = error.response?.status;
      
      // Parse error message for specific cases
      let parsedErrors = error.response?.data?.errors || [errorMessage];
      
      // If it's a generic "Invalid email or password", we can't tell which one is wrong
      // But we'll show the message as is
      if (errorMessage.toLowerCase().includes('invalid email or password')) {
        parsedErrors = ['Invalid email address or password. Please check your credentials and try again.'];
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: parsedErrors,
        isRateLimited: statusCode === 429,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
        errors: error.response?.data?.errors || [],
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const fetchUser = async () => {
    try {
      console.log('📡 Fetching user data from API...');
      const response = await authAPI.getMe();
      if (response.success) {
        console.log('✅ User data fetched:', response.user);
        console.log(`💰 User balance: $${response.user.balance}`);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return response.user;
      } else {
        console.error('❌ Failed to fetch user:', response.message);
      }
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

