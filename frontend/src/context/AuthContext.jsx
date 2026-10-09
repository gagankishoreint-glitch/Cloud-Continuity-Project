import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const initAuth = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem('continuity_token');
      if (!token) {
        // Auto-login as demo user for seamless instant evaluation
        try {
          const res = await api.login({
            username_or_email: 'demo_engineer',
            password: 'continuity2026'
          });
          localStorage.setItem('continuity_token', res.access_token);
          setUser(res.user);
        } catch (loginErr) {
          console.warn('Demo login failed:', loginErr);
        }
      } else {
        const me = await api.getMe();
        setUser(me);
      }

      // Fetch devices
      const devList = await api.getDevices();
      setDevices(devList);
      const curr = devList.find(d => d.is_current) || devList[0];
      setCurrentDevice(curr);
    } catch (err) {
      console.error('Auth initialization error:', err);
      // Fallback demo user
      try {
        const res = await api.login({
          username_or_email: 'demo_engineer',
          password: 'continuity2026'
        });
        localStorage.setItem('continuity_token', res.access_token);
        setUser(res.user);
        const devList = await api.getDevices();
        setDevices(devList);
        setCurrentDevice(devList.find(d => d.is_current) || devList[0]);
      } catch (e) {
        setAuthError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.login({ username_or_email: username, password });
      localStorage.setItem('continuity_token', res.access_token);
      setUser(res.user);
      const devList = await api.getDevices();
      setDevices(devList);
      setCurrentDevice(devList.find(d => d.is_current) || devList[0]);
      return res;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, username, password, fullName) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.register({ email, username, password, full_name: fullName });
      localStorage.setItem('continuity_token', res.access_token);
      setUser(res.user);
      const devList = await api.getDevices();
      setDevices(devList);
      setCurrentDevice(devList[0]);
      return res;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('continuity_token');
    setUser(null);
    setDevices([]);
    setCurrentDevice(null);
  };

  const switchActiveDevice = async (deviceId) => {
    try {
      const updated = await api.switchDevice(deviceId);
      const devList = await api.getDevices();
      setDevices(devList);
      setCurrentDevice(updated);
      return updated;
    } catch (err) {
      console.error('Error switching device:', err);
    }
  };

  const updateUserSettings = async (newSettings) => {
    try {
      const updatedUser = await api.updateSettings(newSettings);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      devices,
      currentDevice,
      loading,
      authError,
      login,
      register,
      logout,
      switchActiveDevice,
      updateUserSettings,
      refreshAuth: initAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
