import { Platform } from 'react-native';

// API service — connects to Flask backend
// Change this IP to your computer's local IP when testing on a physical device
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return `http://${hostname}:5000`;
  }
  return 'http://192.168.0.141:5000';
};

export const BASE_URL = getBaseUrl();

const api = async (endpoint, method = 'GET', body = null) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  return res.json();
};

export const authAPI = {
  login: (username, password) => api('/api/auth/login', 'POST', { username, password }),
  register: (data) => api('/api/auth/register', 'POST', data),
};

export const fusionAPI = {
  fuse: (data) => api('/api/fuse', 'POST', data),
  reason: (data) => api('/api/reason', 'POST', data),
  logIntake: (data) => api('/api/log-intake', 'POST', data),
  userHistory: (userId) => api(`/api/user/history?user_id=${userId}`),
};

export const adminAPI = {
  dashboard: () => api('/api/admin/dashboard'),
};

export const chatAPI = {
  send: (message, vitals, foodInfo, history) =>
    api('/api/bot-chat', 'POST', { message, vitals, food_info: foodInfo, history }),
};

export const exportAPI = {
  generate: (data) => api('/api/export-clinical', 'POST', data),
};
