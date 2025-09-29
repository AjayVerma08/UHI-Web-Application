import { api } from './api';

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Login failed');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Registration failed');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Simple token validation - in production, you might want to decode JWT
    // and check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
};