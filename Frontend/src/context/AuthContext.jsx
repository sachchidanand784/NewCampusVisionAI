import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check for existing login session
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const response = await apiClient.get('/auth/profile/');
          setUser(response.data);
        } catch (error) {
          console.error("Token initialization failed:", error);
          // Interceptor handles logout if refresh fails
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login/', { username, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data || { detail: "Authentication failed. Try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const register = async (registerData) => {
    try {
      const response = await apiClient.post('/auth/register/', registerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: "Registration failed." };
    }
  };

  const requestOtp = async (email) => {
    try {
      const response = await apiClient.post('/auth/request-otp/', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: "Request failed." };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await apiClient.post('/auth/verify-otp/', { email, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: "Verification failed." };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password-confirm/', {
        email,
        otp,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: "Password reset failed." };
    }
  };

  const resetPasswordRequest = async (email) => {
    try {
      const response = await apiClient.post('/auth/reset-password-request/', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: "Password reset request failed." };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.patch('/auth/profile/', profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { detail: "Profile update failed." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        requestOtp,
        verifyOtp,
        resetPassword,
        resetPasswordRequest,
        updateProfile,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
